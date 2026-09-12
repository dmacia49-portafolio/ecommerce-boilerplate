import {
    CartStatus,
    InventoryReservationStatus,
    type Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findCartForCheckout(
    tx: Prisma.TransactionClient,
    cartToken: string,
) {
    const now = new Date();

    return tx.cart.findFirst({
        where: {
            cartToken,

            status: CartStatus.ACTIVE,

            OR: [
                {
                    expiresAt: null,
                },
                {
                    expiresAt: {
                        gt: now,
                    },
                },
            ],
        },

        include: {
            items: {
                orderBy: {
                    variantId: "asc",
                },

                include: {
                    variant: {
                        include: {
                            inventory: true,
                            product: true,
                        },
                    },
                },
            },
        },
    });
}

export async function tryReserveInventory(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantity: number,
) {
    const affectedRows = await tx.$executeRaw`
    UPDATE "inventory"
    SET
      "quantityReserved" = "quantityReserved" + ${quantity},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE
      "variantId" = ${variantId}
      AND ${quantity} > 0
      AND (
        "quantityAvailable" - "quantityReserved"
      ) >= ${quantity}
  `;

    return affectedRows === 1;
}

type CreateReservationInput = {
    orderId: string;
    variantId: string;
    quantity: number;
    expiresAt: Date;
};

export async function createInventoryReservation(
    tx: Prisma.TransactionClient,
    {
        orderId,
        variantId,
        quantity,
        expiresAt,
    }: CreateReservationInput,
) {
    return tx.inventoryReservation.create({
        data: {
            orderId,
            variantId,
            quantity,

            status:
                InventoryReservationStatus.ACTIVE,

            expiresAt,
        },
    });
}

export async function markCartConverted(
    tx: Prisma.TransactionClient,
    cartId: string,
) {
    const result = await tx.cart.updateMany({
        where: {
            id: cartId,
            status: CartStatus.ACTIVE,
        },

        data: {
            status: CartStatus.CONVERTED,
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
        GREATEST(
          "quantityReserved" - ${quantity},
          0
        ),
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE
      "variantId" = ${variantId}
  `;

    return affectedRows === 1;
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

      "updatedAt" = CURRENT_TIMESTAMP
    WHERE
      "variantId" = ${variantId}

      AND "quantityAvailable" >= ${quantity}

      AND "quantityReserved" >= ${quantity}
  `;

    return affectedRows === 1;
}

export async function findCheckoutOrderByNumber(
    orderNumber: string,
) {
    return prisma.order.findUnique({
        where: {
            orderNumber,
        },

        include: {
            items: {
                orderBy: {
                    createdAt: "asc",
                },
            },

            reservations: {
                orderBy: {
                    expiresAt: "asc",
                },
            },
        },
    });
}
