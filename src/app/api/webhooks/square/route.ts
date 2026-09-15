import { NextResponse } from "next/server";

import {
    verifySquareWebhook,
} from "@/features/payments/providers/square/square.webhook";

export const runtime = "nodejs";

type SquareWebhookEvent = {
    event_id?: string;
    type?: string;
    created_at?: string;

    data?: {
        type?: string;
        id?: string;

        object?: {
            payment?: {
                id?: string;
                status?: string;
            };
        };
    };
};

export async function POST(
    request: Request,
) {
    /*
     * IMPORTANT:
     *
     * Square signature verification requires
     * the exact raw request body.
     *
     * Do not call request.json() before this.
     */
    const rawBody =
        await request.text();

    const signature =
        request.headers.get(
            "x-square-hmacsha256-signature",
        );

    if (!signature) {
        return NextResponse.json(
            {
                error:
                    "Missing Square webhook signature.",
            },
            {
                status: 403,
            },
        );
    }

    try {
        const valid =
            await verifySquareWebhook(
                signature,
                rawBody,
            );

        if (!valid) {
            return NextResponse.json(
                {
                    error:
                        "Invalid Square webhook signature.",
                },
                {
                    status: 403,
                },
            );
        }

        let event:
            SquareWebhookEvent;

        try {
            event =
                JSON.parse(
                    rawBody,
                ) as SquareWebhookEvent;
        } catch {
            return NextResponse.json(
                {
                    error:
                        "Invalid webhook body.",
                },
                {
                    status: 400,
                },
            );
        }

        /*
         * We are intentionally NOT changing
         * payment/order state yet.
         *
         * Database processing comes in the
         * next step.
         */
        console.info(
            "Verified Square webhook:",
            {
                eventId:
                    event.event_id,

                type:
                    event.type,

                paymentId:
                    event.data?.object
                        ?.payment?.id,

                paymentStatus:
                    event.data?.object
                        ?.payment?.status,
            },
        );

        return NextResponse.json(
            {
                received: true,
            },
            {
                status: 200,
            },
        );
    } catch (error) {
        console.error(
            "Square webhook processing error:",
            error,
        );

        return NextResponse.json(
            {
                error:
                    "Unable to process Square webhook.",
            },
            {
                status: 500,
            },
        );
    }
}