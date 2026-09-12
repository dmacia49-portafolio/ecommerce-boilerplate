import { prisma } from "@/lib/db/prisma";

import {
    cancelPendingOrder,
    countActiveReservationsForOrder,
    findExpiredActiveReservations,
    markReservationExpired,
    releaseReservedInventory,
    findPendingCheckoutForCancellation,
    markReservationReleased,
} from "./reservation.repository";

const DEFAULT_BATCH_SIZE = 100;

type ReservationCandidate = {
    id: string;
    orderId: string;
    variantId: string;
    quantity: number;
    expiresAt: Date;
};

async function expireReservation(
    reservation: ReservationCandidate,
    now: Date,
) {
    return prisma.$transaction(
        async (tx) => {
            // ====================================================
            // CLAIM THE RESERVATION
            //
            // Only ACTIVE + expired reservations can transition
            // to EXPIRED.
            //
            // If another cleanup process already handled it,
            // this returns false.
            // ====================================================

            const claimed =
                await markReservationExpired(
                    tx,
                    reservation.id,
                    now,
                );

            if (!claimed) {
                return false;
            }

            // ====================================================
            // RELEASE INVENTORY
            // ====================================================

            const released =
                await releaseReservedInventory(
                    tx,
                    reservation.variantId,
                    reservation.quantity,
                );

            if (!released) {
                throw new Error(
                    `Inventory reservation ${reservation.id} could not be released because the inventory state is inconsistent.`,
                );
            }

            // ====================================================
            // CHECK ORDER
            //
            // If this was the final ACTIVE reservation on an
            // unpaid pending order, cancel the order.
            // ====================================================

            const activeReservations =
                await countActiveReservationsForOrder(
                    tx,
                    reservation.orderId,
                );

            if (activeReservations === 0) {
                await cancelPendingOrder(
                    tx,
                    reservation.orderId,
                );
            }

            return true;
        },
    );
}

export async function expireDueReservations(
    batchSize = DEFAULT_BATCH_SIZE,
) {
    if (
        !Number.isInteger(batchSize) ||
        batchSize < 1
    ) {
        throw new Error(
            "Reservation cleanup batch size must be a positive integer.",
        );
    }

    let expiredCount = 0;

    while (true) {
        const now = new Date();

        const reservations =
            await findExpiredActiveReservations(
                now,
                batchSize,
            );

        if (reservations.length === 0) {
            break;
        }

        let processedThisBatch = 0;

        for (const reservation of reservations) {
            const expired =
                await expireReservation(
                    reservation,
                    now,
                );

            if (expired) {
                expiredCount++;
                processedThisBatch++;
            }
        }

        if (
            reservations.length <
            batchSize ||
            processedThisBatch === 0
        ) {
            break;
        }
    }

    return {
        expiredCount,
    };
}

export async function cancelAnonymousCheckout(
    checkoutToken: string,
) {
    if (!checkoutToken) {
        throw new Error(
            "Checkout authorization is missing.",
        );
    }

    return prisma.$transaction(
        async (tx) => {
            const order =
                await findPendingCheckoutForCancellation(
                    tx,
                    checkoutToken,
                );

            if (!order) {
                return {
                    cancelled: false,
                };
            }

            for (const reservation of order.reservations) {
                const claimed =
                    await markReservationReleased(
                        tx,
                        reservation.id,
                    );

                if (!claimed) {
                    continue;
                }

                const released =
                    await releaseReservedInventory(
                        tx,
                        reservation.variantId,
                        reservation.quantity,
                    );

                if (!released) {
                    throw new Error(
                        `Could not release reservation ${reservation.id}.`,
                    );
                }
            }

            await cancelPendingOrder(
                tx,
                order.id,
            );

            return {
                cancelled: true,
                orderNumber:
                    order.orderNumber,
            };
        },
    );
}