"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
    CART_COOKIE_NAME,
} from "@/features/cart/cart.constants";

import {
    CheckoutError,
    CheckoutInventoryError,
    startAnonymousCheckout,
} from "./checkout.service";

import {
    CHECKOUT_COOKIE_MAX_AGE_SECONDS,
    CHECKOUT_COOKIE_NAME,
} from "./checkout.constants";

import {
    cancelAnonymousCheckout,
} from "./reservation.service";

const checkoutSchema = z.object({
    email: z
        .string()
        .trim()
        .email(
            "Enter a valid email address.",
        )
        .max(254),
});

function checkoutErrorUrl(
    message: string,
) {
    return `/checkout?error=${encodeURIComponent(
        message,
    )}`;
}

export async function startCheckoutAction(
    formData: FormData,
) {
    const validation =
        checkoutSchema.safeParse({
            email:
                formData.get("email"),
        });

    if (!validation.success) {
        redirect(
            checkoutErrorUrl(
                validation.error.issues[0]
                    ?.message ??
                "Enter a valid email address.",
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

    let orderNumber:
        | string
        | null = null;

    let checkoutToken: string | null = null;

    let errorMessage:
        | string
        | null = null;

    try {
        const checkout =
            await startAnonymousCheckout({
                cartToken,
                customerEmail:
                    validation.data.email,
            });

        orderNumber =
            checkout.orderNumber;
        checkoutToken = checkout.checkoutToken;

    } catch (error) {
        if (
            error instanceof
            CheckoutInventoryError
        ) {
            errorMessage =
                error.message;
        } else if (
            error instanceof CheckoutError
        ) {
            errorMessage =
                error.message;
        } else {
            console.error(
                "Checkout failed:",
                error,
            );

            errorMessage =
                "Checkout could not be started. Please try again.";
        }
    }

    if (errorMessage) {
        redirect(
            checkoutErrorUrl(
                errorMessage,
            ),
        );
    }

    if (!orderNumber) {
        redirect(
            checkoutErrorUrl(
                "Checkout could not be started.",
            ),
        );
    }

    if (!checkoutToken) {
        redirect(
            checkoutErrorUrl(
                "Checkout could not be started.",
            ),
        );
    }

    cookieStore.set(
        CHECKOUT_COOKIE_NAME,
        checkoutToken,
        {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge:
                CHECKOUT_COOKIE_MAX_AGE_SECONDS,
            priority: "medium",
        },
    );

    // The cart has now been converted into
    // a pending order.
    cookieStore.delete(
        CART_COOKIE_NAME,
    );

    revalidatePath("/cart");
    revalidatePath("/checkout");

    redirect(
        `/checkout/${orderNumber}`,
    );
}

export async function cancelCheckoutAction() {
    const cookieStore =
        await cookies();

    const checkoutToken =
        cookieStore.get(
            CHECKOUT_COOKIE_NAME,
        )?.value;

    if (!checkoutToken) {
        redirect("/");
    }

    let errorMessage:
        | string
        | null = null;

    try {
        await cancelAnonymousCheckout(
            checkoutToken,
        );
    } catch (error) {
        console.error(
            "Unable to cancel checkout:",
            error,
        );

        errorMessage =
            "We could not cancel the checkout.";
    }

    if (errorMessage) {
        throw new Error(
            errorMessage,
        );
    }

    cookieStore.delete(
        CHECKOUT_COOKIE_NAME,
    );

    revalidatePath("/checkout");
    revalidatePath("/cart");

    redirect(
        "/checkout/cancelled",
    );
}