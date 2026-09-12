import { CartStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function findVariantForCart(
    variantId: string,
) {
    return prisma.productVariant.findUnique({
        where: {
            id: variantId,
        },

        include: {
            inventory: true,
            product: true,
        },
    });
}

export async function findActiveAnonymousCartByToken(
    cartToken: string,
) {
    const now = new Date();

    return prisma.cart.findFirst({
        where: {
            cartToken,
            userId: null,
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
    });
}

export async function createAnonymousCart(
    expiresAt: Date,
) {
    return prisma.cart.create({
        data: {
            expiresAt,
        },
    });
}

export async function findCartItem(
    cartId: string,
    variantId: string,
) {
    return prisma.cartItem.findUnique({
        where: {
            cartId_variantId: {
                cartId,
                variantId,
            },
        },
    });
}

export async function findFirstCartItem(
    cartId: string,
) {
    return prisma.cartItem.findFirst({
        where: {
            cartId,
        },

        include: {
            variant: true,
        },
    });
}

type SetCartItemInput = {
    cartId: string;
    variantId: string;
    quantity: number;
    unitPriceSnapshot: unknown;
};

export async function setCartItem({
    cartId,
    variantId,
    quantity,
    unitPriceSnapshot,
}: SetCartItemInput) {
    return prisma.cartItem.upsert({
        where: {
            cartId_variantId: {
                cartId,
                variantId,
            },
        },

        update: {
            quantity,
            unitPriceSnapshot:
                unitPriceSnapshot as never,
        },

        create: {
            cartId,
            variantId,
            quantity,
            unitPriceSnapshot:
                unitPriceSnapshot as never,
        },
    });
}

export async function findCartItemForMutation(
    cartId: string,
    itemId: string,
) {
    return prisma.cartItem.findFirst({
        where: {
            id: itemId,
            cartId,
        },

        include: {
            variant: {
                include: {
                    inventory: true,
                    product: true,
                },
            },
        },
    });
}

export async function updateCartItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
) {
    return prisma.cartItem.updateMany({
        where: {
            id: itemId,
            cartId,
        },

        data: {
            quantity,
        },
    });
}

export async function deleteCartItemById(
    cartId: string,
    itemId: string,
) {
    return prisma.cartItem.deleteMany({
        where: {
            id: itemId,
            cartId,
        },
    });
}

export async function countCartItems(
    cartId: string,
) {
    return prisma.cartItem.count({
        where: {
            cartId,
        },
    });
}

export async function deleteCartById(
    cartId: string,
) {
    return prisma.cart.delete({
        where: {
            id: cartId,
        },
    });
}

export async function findAnonymousCartForStorefront(
    cartToken: string,
) {
    const now = new Date();

    return prisma.cart.findFirst({
        where: {
            cartToken,
            userId: null,
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
                    createdAt: "asc",
                },

                include: {
                    variant: {
                        include: {
                            inventory: true,

                            product: {
                                include: {
                                    images: {
                                        orderBy: {
                                            sortOrder: "asc",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}