import {
    InventoryReservationStatus,
    OrderPaymentStatus,
    OrderStatus,
    type Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findExpiredActiveReservations(
    now: Date,
    take: number,
) {
    return prisma.inventoryReservation.findMany({
        where: {
            status:
                InventoryReservationStatus.ACTIVE,

            expiresAt: {
                lte: now,
            },
        },

        select: {
            id: true,
            orderId: true,
            variantId: true,
            quantity: true,
            expiresAt: true,
        },

        orderBy: {
            expiresAt: "asc",
        },

        take,
    });
}

export async function markReservationExpired(
    tx: Prisma.TransactionClient,
    reservationId: string,
    now: Date,
) {
    const result =
        await tx.inventoryReservation.updateMany({
            where: {
                id: reservationId,

                status:
                    InventoryReservationStatus.ACTIVE,

                expiresAt: {
                    lte: now,
                },
            },

            data: {
                status:
                    InventoryReservationStatus.EXPIRED,
            },
        });

    return result.count === 1;
}

export async function releaseReservedInventory(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantity: number,
) {
    const affectedRows = await tx.$executeRaw`
    UPDATE "inventory"
    SET
      "quantityReserved" =
        "quantityReserved" - ${quantity},

      "updatedAt" =
        CURRENT_TIMESTAMP

    WHERE
      "variantId" = ${variantId}

      AND "quantityReserved" >= ${quantity}
  `;

    return affectedRows === 1;
}

export async function countActiveReservationsForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
) {
    return tx.inventoryReservation.count({
        where: {
            orderId,

            status:
                InventoryReservationStatus.ACTIVE,
        },
    });
}

export async function cancelPendingOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
) {
    const result =
        await tx.order.updateMany({
            where: {
                id: orderId,

                status:
                    OrderStatus.PENDING,

                paymentStatus:
                    OrderPaymentStatus.PENDING,
            },

            data: {
                status:
                    OrderStatus.CANCELLED,
            },
        });

    return result.count === 1;
}

export async function findPendingCheckoutForCancellation(
    tx: Prisma.TransactionClient,
    checkoutToken: string,
) {
    return tx.order.findFirst({
        where: {
            checkoutToken,
            status: OrderStatus.PENDING,
            paymentStatus:
                OrderPaymentStatus.PENDING,
        },

        include: {
            reservations: {
                where: {
                    status:
                        InventoryReservationStatus.ACTIVE,
                },
            },
        },
    });
}

export async function markReservationReleased(
    tx: Prisma.TransactionClient,
    reservationId: string,
) {
    const result =
        await tx.inventoryReservation.updateMany({
            where: {
                id: reservationId,
                status:
                    InventoryReservationStatus.ACTIVE,
            },

            data: {
                status:
                    InventoryReservationStatus.RELEASED,
            },
        });

    return result.count === 1;
}

export async function findActiveReservationsForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
) {
    return tx.inventoryReservation.findMany({
        where: {
            orderId,

            status:
                InventoryReservationStatus.ACTIVE,
        },

        select: {
            id: true,
            orderId: true,
            variantId: true,
            quantity: true,
        },
    });
}

export async function finalizeReservedInventory(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantity: number,
) {
    const affectedRows = await tx.$executeRaw`
        UPDATE "inventory"
        SET
            "quantityAvailable" =
                "quantityAvailable" - ${quantity},

            "quantityReserved" =
                "quantityReserved" - ${quantity},

            "updatedAt" =
                CURRENT_TIMESTAMP

        WHERE
            "variantId" = ${variantId}

            AND "quantityAvailable" >= ${quantity}

            AND "quantityReserved" >= ${quantity}
    `;

    return affectedRows === 1;
}

export async function markReservationCompleted(
    tx: Prisma.TransactionClient,
    reservationId: string,
) {
    const result =
        await tx.inventoryReservation.updateMany({
            where: {
                id: reservationId,

                status:
                    InventoryReservationStatus.ACTIVE,
            },

            data: {
                status:
                    InventoryReservationStatus.COMPLETED,
            },
        });

    return result.count === 1;
}

export async function markOrderPaymentProcessing(
    tx: Prisma.TransactionClient,
    orderId: string,
) {
    const result =
        await tx.order.updateMany({
            where: {
                id: orderId,

                status:
                    OrderStatus.PENDING,

                paymentStatus:
                    OrderPaymentStatus.PENDING,
            },

            data: {
                status:
                    OrderStatus.PROCESSING,
            },
        });

    return result.count === 1;
}

export async function findOrderReservationState(
    tx: Prisma.TransactionClient,
    orderId: string,
) {
    return tx.order.findUnique({
        where: {
            id: orderId,
        },

        select: {
            id: true,
            status: true,
            paymentStatus: true,
        },
    });
}