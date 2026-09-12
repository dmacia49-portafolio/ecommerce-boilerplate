import { randomUUID } from "node:crypto";

import {
    InventoryReservationStatus,
    Prisma,
    ProductStatus,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
    CHECKOUT_RESERVATION_MINUTES,
    CHECKOUT_TRANSACTION_RETRIES,
} from "./checkout.constants";

import {
    createInventoryReservation,
    findCartForCheckout,
    findCheckoutOrderByNumber,
    markCartConverted,
    tryReserveInventory,
} from "./checkout.repository";

import type {
    CheckoutOrderSummary,
    CheckoutReservationResult,
} from "./checkout.types";



export class CheckoutError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "CheckoutError";
    }
}

export class CheckoutInventoryError extends CheckoutError {
    constructor(message: string) {
        super(message);

        this.name = "CheckoutInventoryError";
    }
}

type StartCheckoutInput = {
    cartToken: string;
    customerEmail: string;
};

// ============================================================
// MONEY HELPERS
// Store calculations as integer cents.
// Decimal(12,2) values fit safely inside JavaScript's
// safe integer range when converted to cents.
// ============================================================

function decimalToCents(value: string): number {
    const match =
        /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);

    if (!match) {
        throw new CheckoutError(
            "A product contains an invalid price.",
        );
    }

    const whole = Number(match[1]);

    const fraction = Number(
        (match[2] ?? "")
            .padEnd(2, "0"),
    );

    const cents =
        whole * 100 + fraction;

    if (!Number.isSafeInteger(cents)) {
        throw new CheckoutError(
            "A product price is outside the supported range.",
        );
    }

    return cents;
}

function centsToDecimalString(
    cents: number,
): string {
    if (!Number.isSafeInteger(cents)) {
        throw new CheckoutError(
            "An invalid monetary amount was calculated.",
        );
    }

    const whole =
        Math.floor(cents / 100);

    const fraction =
        Math.abs(cents % 100)
            .toString()
            .padStart(2, "0");

    return `${whole}.${fraction}`;
}

function createOrderNumber() {
    return `ORD-${randomUUID()
        .replaceAll("-", "")
        .toUpperCase()}`;
}

function isTransactionConflict(
    error: unknown,
) {
    if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error)
    ) {
        return false;
    }

    return (
        (error as { code?: string }).code ===
        "P2034"
    );
}

export async function startAnonymousCheckout({
    cartToken,
    customerEmail,
}: StartCheckoutInput): Promise<CheckoutReservationResult> {
    const email =
        customerEmail
            .trim()
            .toLowerCase();

    if (!email) {
        throw new CheckoutError(
            "Customer email is required.",
        );
    }

    for (
        let attempt = 1;
        attempt <=
        CHECKOUT_TRANSACTION_RETRIES;
        attempt++
    ) {
        try {
            return await prisma.$transaction(
                async (tx) => {
                    // ==================================================
                    // LOAD CART
                    // ==================================================

                    const cart =
                        await findCartForCheckout(
                            tx,
                            cartToken,
                        );

                    if (!cart) {
                        throw new CheckoutError(
                            "Your cart is empty, expired, or checkout has already started.",
                        );
                    }

                    if (
                        cart.items.length === 0
                    ) {
                        throw new CheckoutError(
                            "Your cart is empty.",
                        );
                    }

                    // ==================================================
                    // VALIDATE ITEMS
                    // ==================================================

                    const checkoutItems =
                        cart.items.map((item) => {
                            const variant =
                                item.variant;

                            if (
                                !variant.isActive ||
                                variant.product.status !==
                                ProductStatus.ACTIVE
                            ) {
                                throw new CheckoutInventoryError(
                                    `${variant.product.name} is no longer available.`,
                                );
                            }

                            if (!variant.inventory) {
                                throw new CheckoutInventoryError(
                                    `Inventory information is unavailable for ${variant.product.name}.`,
                                );
                            }

                            if (
                                item.quantity < 1
                            ) {
                                throw new CheckoutError(
                                    "The cart contains an invalid quantity.",
                                );
                            }

                            // IMPORTANT:
                            // Use the current database price.
                            // Do not trust the old cart price snapshot.
                            const price =
                                variant.price.toString();

                            const unitPriceCents =
                                decimalToCents(
                                    price,
                                );

                            const lineTotalCents =
                                unitPriceCents *
                                item.quantity;

                            if (
                                !Number.isSafeInteger(
                                    lineTotalCents,
                                )
                            ) {
                                throw new CheckoutError(
                                    "An invalid order total was calculated.",
                                );
                            }

                            return {
                                productId:
                                    variant.product.id,

                                productName:
                                    variant.product.name,

                                variantId:
                                    variant.id,

                                variantName:
                                    variant.name,

                                sku:
                                    variant.sku,

                                currency:
                                    variant.currency,

                                quantity:
                                    item.quantity,

                                unitPrice:
                                    price,

                                lineTotalCents,
                            };
                        });

                    // ==================================================
                    // CURRENCY VALIDATION
                    // ==================================================

                    const currencies =
                        new Set(
                            checkoutItems.map(
                                (item) =>
                                    item.currency,
                            ),
                        );

                    if (
                        currencies.size !== 1
                    ) {
                        throw new CheckoutError(
                            "Checkout cannot contain multiple currencies.",
                        );
                    }

                    const currency =
                        checkoutItems[0]
                            .currency;

                    // ==================================================
                    // CALCULATE ORDER TOTAL
                    // ==================================================

                    const subtotalCents =
                        checkoutItems.reduce(
                            (total, item) =>
                                total +
                                item.lineTotalCents,
                            0,
                        );

                    if (
                        !Number.isSafeInteger(
                            subtotalCents,
                        )
                    ) {
                        throw new CheckoutError(
                            "An invalid order total was calculated.",
                        );
                    }

                    const subtotal =
                        centsToDecimalString(
                            subtotalCents,
                        );

                    const orderNumber =
                        createOrderNumber();

                    // ==================================================
                    // 30-MINUTE INVENTORY RESERVATION
                    // ==================================================

                    const reservationExpiresAt =
                        new Date(
                            Date.now() +
                            CHECKOUT_RESERVATION_MINUTES *
                            60 *
                            1000,
                        );

                    // ==================================================
                    // CREATE PENDING ORDER
                    // ==================================================

                    const order =
                        await tx.order.create({
                            data: {
                                orderNumber,

                                customerEmail:
                                    email,

                                currency,

                                subtotal,

                                discountTotal:
                                    "0.00",

                                taxTotal:
                                    "0.00",

                                shippingTotal:
                                    "0.00",

                                grandTotal:
                                    subtotal,

                                items: {
                                    create:
                                        checkoutItems.map(
                                            (item) => ({
                                                productId:
                                                    item.productId,

                                                variantId:
                                                    item.variantId,

                                                productName:
                                                    item.productName,

                                                variantName:
                                                    item.variantName,

                                                sku:
                                                    item.sku,

                                                quantity:
                                                    item.quantity,

                                                unitPrice:
                                                    item.unitPrice,

                                                total:
                                                    centsToDecimalString(
                                                        item.lineTotalCents,
                                                    ),
                                            }),
                                        ),
                                },
                            },
                        });

                    // ==================================================
                    // ATOMIC INVENTORY RESERVATION
                    // ==================================================

                    for (
                        const item of checkoutItems
                    ) {
                        const reserved =
                            await tryReserveInventory(
                                tx,
                                item.variantId,
                                item.quantity,
                            );

                        if (!reserved) {
                            throw new CheckoutInventoryError(
                                `${item.productName} — ${item.variantName} just sold out or no longer has enough inventory.`,
                            );
                        }

                        await createInventoryReservation(
                            tx,
                            {
                                orderId:
                                    order.id,

                                variantId:
                                    item.variantId,

                                quantity:
                                    item.quantity,

                                expiresAt:
                                    reservationExpiresAt,
                            },
                        );
                    }

                    // ==================================================
                    // CONVERT CART
                    // ==================================================

                    const cartConverted =
                        await markCartConverted(
                            tx,
                            cart.id,
                        );

                    if (!cartConverted) {
                        throw new CheckoutError(
                            "Checkout has already started for this cart.",
                        );
                    }

                    return {
                        orderId:
                            order.id,

                        orderNumber:
                            order.orderNumber,

                        checkoutToken: order.checkoutToken,

                        currency,

                        subtotal:
                            subtotalCents / 100,

                        grandTotal:
                            subtotalCents / 100,

                        reservationExpiresAt,
                    };
                },

                {
                    isolationLevel:
                        Prisma
                            .TransactionIsolationLevel
                            .Serializable,

                    maxWait: 5000,

                    timeout: 10000,
                },
            );
        } catch (error) {
            if (
                isTransactionConflict(
                    error,
                ) &&
                attempt <
                CHECKOUT_TRANSACTION_RETRIES
            ) {
                continue;
            }

            throw error;
        }
    }

    throw new CheckoutError(
        "Checkout could not be started. Please try again.",
    );
}

export async function getCheckoutOrderSummary(
    orderNumber: string,
): Promise<CheckoutOrderSummary | null> {
    const order =
        await findCheckoutOrderByNumber(
            orderNumber,
        );

    if (!order) {
        return null;
    }

    const activeReservations =
        order.reservations.filter(
            (reservation) =>
                reservation.status ===
                InventoryReservationStatus.ACTIVE,
        );

    const reservationExpiresAt =
        activeReservations.length > 0
            ? activeReservations.reduce(
                (earliest, reservation) =>
                    reservation.expiresAt <
                        earliest
                        ? reservation.expiresAt
                        : earliest,

                activeReservations[0]
                    .expiresAt,
            )
            : null;

    return {
        orderNumber:
            order.orderNumber,

        currency:
            order.currency,

        subtotal:
            Number(order.subtotal),

        grandTotal:
            Number(order.grandTotal),

        items: order.items.map(
            (item) => ({
                id: item.id,

                productName:
                    item.productName,

                variantName:
                    item.variantName,

                sku: item.sku,

                quantity:
                    item.quantity,

                unitPrice:
                    Number(
                        item.unitPrice,
                    ),

                total:
                    Number(item.total),
            }),
        ),

        reservationExpiresAt,
    };
}