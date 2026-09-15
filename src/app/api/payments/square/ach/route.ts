import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
    CHECKOUT_COOKIE_NAME,
} from "@/features/checkout/checkout.constants";

import {
    PaymentProviderError,
} from "@/features/payments/shared/payment.errors";

import {
    submitSquareAchPayment,
} from "@/features/payments/methods/ach/providers/square/square-ach.service";

import {
    squareAchPaymentRequestSchema,
} from "@/features/payments/methods/ach/providers/square/square-ach.validation";

export const runtime = "nodejs";

export async function POST(
    request: Request,
) {
    try {
        const cookieStore =
            await cookies();

        const checkoutToken =
            cookieStore.get(
                CHECKOUT_COOKIE_NAME,
            )?.value;

        if (!checkoutToken) {
            return NextResponse.json(
                {
                    error:
                        "Checkout session is missing or expired.",
                },
                {
                    status: 401,
                },
            );
        }

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    error:
                        "Invalid request body.",
                },
                {
                    status: 400,
                },
            );
        }

        const parsed =
            squareAchPaymentRequestSchema.safeParse(
                body,
            );

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error:
                        "Invalid payment request.",
                },
                {
                    status: 400,
                },
            );
        }

        const result =
            await submitSquareAchPayment({
                orderNumber:
                    parsed.data.orderNumber,

                sourceToken:
                    parsed.data.sourceToken,

                checkoutToken,
            });

        if (
            result.status === "PROCESSING" ||
            result.status === "SUCCEEDED"
        ) {
            cookieStore.set(
                CHECKOUT_COOKIE_NAME,
                "",
                {
                    httpOnly: true,
                    secure:
                        process.env.NODE_ENV ===
                        "production",
                    sameSite: "lax",
                    path: "/",
                    maxAge: 0,
                    priority: "medium",
                },
            );
        }

        return NextResponse.json(
            {
                paymentId:
                    result.paymentId,

                status:
                    result.status,
            },
            {
                status: 200,

                headers: {
                    "Cache-Control":
                        "no-store",
                },
            },
        );
    } catch (error) {
        if (
            error instanceof
            PaymentProviderError
        ) {
            return NextResponse.json(
                {
                    error:
                        error.message,
                },
                {
                    status: 400,
                },
            );
        }

        console.error(
            "Square ACH endpoint error:",
            error,
        );

        return NextResponse.json(
            {
                error:
                    "Unable to process the payment.",
            },
            {
                status: 500,
            },
        );
    }
}