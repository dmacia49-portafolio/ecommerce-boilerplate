"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
    CART_COOKIE_NAME,
    CART_MAX_AGE_SECONDS,
} from "./cart.constants";

import {
    addItemToAnonymousCart,
    CartError,
    clearAnonymousCart,
    removeAnonymousCartItem,
    updateAnonymousCartItem,
} from "./cart.service";

const addToCartSchema = z.object({
    variantId: z.string().uuid(),

    quantity: z.coerce
        .number()
        .int()
        .min(1)
        .max(99),
});

const updateCartItemSchema = z.object({
    itemId: z.string().uuid(),

    quantity: z.coerce
        .number()
        .int()
        .min(1)
        .max(99),
});

const removeCartItemSchema = z.object({
    itemId: z.string().uuid(),
});

export type AddToCartState = {
    error: string | null;
};

function cartErrorUrl(
    message: string,
) {
    return `/cart?error=${encodeURIComponent(
        message,
    )}`;
}

export async function addToCartAction(
    _previousState: AddToCartState,
    formData: FormData,
): Promise<AddToCartState> {
    const result =
        addToCartSchema.safeParse({
            variantId:
                formData.get("variantId"),

            quantity:
                formData.get("quantity"),
        });

    if (!result.success) {
        return {
            error:
                "Please select a valid product option and quantity.",
        };
    }

    const cookieStore =
        await cookies();

    const existingCartToken =
        cookieStore.get(
            CART_COOKIE_NAME,
        )?.value;

    let cartToken: string;

    try {
        const cartResult =
            await addItemToAnonymousCart({
                cartToken:
                    existingCartToken,

                variantId:
                    result.data.variantId,

                quantity:
                    result.data.quantity,
            });

        cartToken =
            cartResult.cartToken;
    } catch (error) {
        if (error instanceof CartError) {
            return {
                error: error.message,
            };
        }

        console.error(
            "Unable to add item to cart:",
            error,
        );

        return {
            error:
                "We could not add this item to your cart.",
        };
    }

    cookieStore.set(
        CART_COOKIE_NAME,
        cartToken,
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "lax",

            path: "/",

            maxAge:
                CART_MAX_AGE_SECONDS,

            priority: "medium",
        },
    );

    revalidatePath("/cart");

    redirect("/cart");
}

export async function updateCartItemAction(
    formData: FormData,
) {
    const result =
        updateCartItemSchema.safeParse({
            itemId:
                formData.get("itemId"),

            quantity:
                formData.get("quantity"),
        });

    if (!result.success) {
        redirect(
            cartErrorUrl(
                "Please enter a valid quantity.",
            ),
        );
    }

    const cookieStore =
        await cookies();

    const cartToken =
        cookieStore.get(
            CART_COOKIE_NAME,
        )?.value;

    if (!cartToken) {
        redirect("/cart");
    }

    let errorMessage: string | null =
        null;

    try {
        await updateAnonymousCartItem({
            cartToken,
            itemId: result.data.itemId,
            quantity:
                result.data.quantity,
        });
    } catch (error) {
        if (error instanceof CartError) {
            errorMessage =
                error.message;
        } else {
            console.error(
                "Unable to update cart item:",
                error,
            );

            errorMessage =
                "We could not update your cart.";
        }
    }

    if (errorMessage) {
        redirect(
            cartErrorUrl(errorMessage),
        );
    }

    revalidatePath("/cart");

    redirect("/cart");
}

export async function removeCartItemAction(
    formData: FormData,
) {
    const result =
        removeCartItemSchema.safeParse({
            itemId:
                formData.get("itemId"),
        });

    if (!result.success) {
        redirect(
            cartErrorUrl(
                "The cart item is invalid.",
            ),
        );
    }

    const cookieStore =
        await cookies();

    const cartToken =
        cookieStore.get(
            CART_COOKIE_NAME,
        )?.value;

    if (!cartToken) {
        redirect("/cart");
    }

    let cartDeleted = false;
    let errorMessage: string | null =
        null;

    try {
        const removeResult =
            await removeAnonymousCartItem({
                cartToken,
                itemId: result.data.itemId,
            });

        cartDeleted =
            removeResult.cartDeleted;
    } catch (error) {
        console.error(
            "Unable to remove cart item:",
            error,
        );

        errorMessage =
            "We could not remove that item.";
    }

    if (errorMessage) {
        redirect(
            cartErrorUrl(errorMessage),
        );
    }

    if (cartDeleted) {
        cookieStore.delete(
            CART_COOKIE_NAME,
        );
    }

    revalidatePath("/cart");

    redirect("/cart");
}

export async function clearCartAction() {
    const cookieStore =
        await cookies();

    const cartToken =
        cookieStore.get(
            CART_COOKIE_NAME,
        )?.value;

    if (cartToken) {
        try {
            await clearAnonymousCart(
                cartToken,
            );
        } catch (error) {
            console.error(
                "Unable to clear cart:",
                error,
            );

            redirect(
                cartErrorUrl(
                    "We could not clear your cart.",
                ),
            );
        }
    }

    cookieStore.delete(
        CART_COOKIE_NAME,
    );

    revalidatePath("/cart");

    redirect("/cart");
}