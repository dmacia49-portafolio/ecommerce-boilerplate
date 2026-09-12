import { ProductStatus } from "@/generated/prisma/client";

import {
    CART_EXPIRATION_MS,
} from "./cart.constants";

import {
    countCartItems,
    createAnonymousCart,
    deleteCartById,
    deleteCartItemById,
    findActiveAnonymousCartByToken,
    findAnonymousCartForStorefront,
    findCartItem,
    findCartItemForMutation,
    findFirstCartItem,
    findVariantForCart,
    setCartItem,
    updateCartItemQuantity,
} from "./cart.repository";

import type {
    StorefrontCart,
} from "./cart.types";

export class CartError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "CartError";
    }
}

type AddItemInput = {
    cartToken?: string;
    variantId: string;
    quantity: number;
};

export async function addItemToAnonymousCart({
    cartToken,
    variantId,
    quantity,
}: AddItemInput) {
    const variant =
        await findVariantForCart(variantId);

    if (
        !variant ||
        !variant.isActive ||
        variant.product.status !==
        ProductStatus.ACTIVE
    ) {
        throw new CartError(
            "This product option is not available.",
        );
    }

    if (!variant.inventory) {
        throw new CartError(
            "Inventory information is unavailable.",
        );
    }

    const availableStock = Math.max(
        variant.inventory.quantityAvailable -
        variant.inventory.quantityReserved,
        0,
    );

    if (availableStock <= 0) {
        throw new CartError(
            "This product option is out of stock.",
        );
    }

    let cart = cartToken
        ? await findActiveAnonymousCartByToken(
            cartToken,
        )
        : null;

    if (!cart) {
        cart = await createAnonymousCart(
            new Date(
                Date.now() + CART_EXPIRATION_MS,
            ),
        );
    }

    const firstCartItem =
        await findFirstCartItem(cart.id);

    if (
        firstCartItem &&
        firstCartItem.variant.currency !==
        variant.currency
    ) {
        throw new CartError(
            "A cart cannot contain multiple currencies.",
        );
    }

    const existingItem = await findCartItem(
        cart.id,
        variant.id,
    );

    const newQuantity =
        (existingItem?.quantity ?? 0) +
        quantity;

    if (newQuantity > availableStock) {
        throw new CartError(
            `Only ${availableStock} item${availableStock === 1 ? "" : "s"
            } are currently available.`,
        );
    }

    await setCartItem({
        cartId: cart.id,
        variantId: variant.id,
        quantity: newQuantity,
        unitPriceSnapshot: variant.price,
    });

    return {
        cartToken: cart.cartToken,
    };
}

type UpdateCartItemInput = {
    cartToken: string;
    itemId: string;
    quantity: number;
};

export async function updateAnonymousCartItem({
    cartToken,
    itemId,
    quantity,
}: UpdateCartItemInput) {
    const cart =
        await findActiveAnonymousCartByToken(
            cartToken,
        );

    if (!cart) {
        throw new CartError(
            "Your cart has expired.",
        );
    }

    const item =
        await findCartItemForMutation(
            cart.id,
            itemId,
        );

    if (!item) {
        throw new CartError(
            "The cart item could not be found.",
        );
    }

    const variant = item.variant;

    if (
        !variant.isActive ||
        variant.product.status !==
        ProductStatus.ACTIVE
    ) {
        throw new CartError(
            "This product is no longer available.",
        );
    }

    if (!variant.inventory) {
        throw new CartError(
            "Inventory information is unavailable.",
        );
    }

    const availableStock = Math.max(
        variant.inventory.quantityAvailable -
        variant.inventory.quantityReserved,
        0,
    );

    if (availableStock === 0) {
        throw new CartError(
            "This product is now out of stock.",
        );
    }

    if (quantity > availableStock) {
        throw new CartError(
            `Only ${availableStock} item${availableStock === 1 ? "" : "s"
            } are currently available.`,
        );
    }

    await updateCartItemQuantity(
        cart.id,
        item.id,
        quantity,
    );
}

type RemoveCartItemInput = {
    cartToken: string;
    itemId: string;
};

export async function removeAnonymousCartItem({
    cartToken,
    itemId,
}: RemoveCartItemInput) {
    const cart =
        await findActiveAnonymousCartByToken(
            cartToken,
        );

    if (!cart) {
        return {
            cartDeleted: true,
        };
    }

    await deleteCartItemById(
        cart.id,
        itemId,
    );

    const remainingItems =
        await countCartItems(cart.id);

    if (remainingItems === 0) {
        await deleteCartById(cart.id);

        return {
            cartDeleted: true,
        };
    }

    return {
        cartDeleted: false,
    };
}

export async function clearAnonymousCart(
    cartToken: string,
) {
    const cart =
        await findActiveAnonymousCartByToken(
            cartToken,
        );

    if (!cart) {
        return;
    }

    await deleteCartById(cart.id);
}

export async function getAnonymousCart(
    cartToken?: string,
): Promise<StorefrontCart | null> {
    if (!cartToken) {
        return null;
    }

    const cart =
        await findAnonymousCartForStorefront(
            cartToken,
        );

    if (!cart || cart.items.length === 0) {
        return null;
    }

    const items = cart.items.map((item) => {
        const inventory =
            item.variant.inventory;

        const availableStock = inventory
            ? Math.max(
                inventory.quantityAvailable -
                inventory.quantityReserved,
                0,
            )
            : 0;

        const available =
            item.variant.isActive &&
            item.variant.product.status ===
            ProductStatus.ACTIVE &&
            availableStock >= item.quantity;

        const unitPrice = Number(
            item.unitPriceSnapshot,
        );

        return {
            id: item.id,

            productName:
                item.variant.product.name,

            productSlug:
                item.variant.product.slug,

            variantId:
                item.variant.id,

            variantName:
                item.variant.name,

            sku: item.variant.sku,

            quantity: item.quantity,

            unitPrice,

            lineTotal:
                unitPrice * item.quantity,

            currency:
                item.variant.currency,

            availableStock,

            available,
        };
    });

    const currency =
        items[0]?.currency ?? "USD";

    const subtotal = items.reduce(
        (total, item) =>
            total + item.lineTotal,
        0,
    );

    const itemCount = items.reduce(
        (total, item) =>
            total + item.quantity,
        0,
    );

    return {
        id: cart.id,
        itemCount,
        subtotal,
        currency,
        items,
    };
}