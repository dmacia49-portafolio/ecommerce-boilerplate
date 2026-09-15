import { randomUUID } from "crypto";

import {
    finalizeOrderReservationsAfterPaymentAccepted,
} from "@/features/checkout/reservation.service";

import {
    PaymentProviderError,
} from "../../../../shared/payment.errors";

import {
    squareAchGateway,
} from "./square-ach.gateway";

import {
    createSquareAchPayment,
    findOrderForSquareAch,
    findReusableSquareAchPayment,
    updateSquarePayment,
} from "./square-ach.repository";

type SubmitSquareAchPaymentInput = {
    orderNumber: string;
    checkoutToken: string;
    sourceToken: string;
};

export type SubmitSquareAchPaymentResult = {
    paymentId: string;
    providerPaymentId: string;

    status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";
};

function decimalToCents(
    value: string,
): number {
    const normalized =
        value.trim();

    const match =
        /^(\d+)(?:\.(\d{1,2}))?$/.exec(
            normalized,
        );

    if (!match) {
        throw new PaymentProviderError(
            "Order total is invalid.",
        );
    }

    const whole =
        Number(match[1]);

    const decimal =
        (match[2] ?? "")
            .padEnd(2, "0");

    const cents =
        whole * 100 +
        Number(decimal);

    if (
        !Number.isSafeInteger(
            cents,
        ) ||
        cents <= 0
    ) {
        throw new PaymentProviderError(
            "Order total is invalid.",
        );
    }

    return cents;
}

export async function submitSquareAchPayment(
    input: SubmitSquareAchPaymentInput,
): Promise<SubmitSquareAchPaymentResult> {
    const sourceToken =
        input.sourceToken.trim();

    if (!sourceToken) {
        throw new PaymentProviderError(
            "Square ACH payment token is required.",
        );
    }

    const order =
        await findOrderForSquareAch(
            input.orderNumber,
            input.checkoutToken,
        );

    if (!order) {
        throw new PaymentProviderError(
            "The checkout session is invalid or the order can no longer be paid.",
        );
    }

    if (
        order.currency !== "USD"
    ) {
        throw new PaymentProviderError(
            "Square ACH currently supports only USD orders.",
        );
    }

    const amount =
        order.grandTotal.toFixed(
            2,
        );

    const amountCents =
        decimalToCents(
            amount,
        );

    let payment =
        await findReusableSquareAchPayment(
            order.id,
        );

    if (!payment) {
        payment =
            await createSquareAchPayment(
                {
                    id:
                        randomUUID(),

                    orderId:
                        order.id,

                    amount,

                    currency:
                        order.currency,

                    idempotencyKey:
                        randomUUID(),
                },
            );
    }

    try {
        const result =
            await squareAchGateway.createPayment(
                {
                    orderId:
                        order.id,

                    orderNumber:
                        order.orderNumber,

                    amountCents,

                    currency:
                        order.currency,

                    customerEmail:
                        "",

                    method:
                        "ACH",

                    sourceToken,

                    idempotencyKey:
                        payment.idempotencyKey,
                },
            );

        await updateSquarePayment(
            {
                paymentId:
                    payment.id,

                providerPaymentId:
                    result.providerPaymentId,

                status:
                    result.status,
            },
        );

        /*
         * ACH is asynchronous.
         *
         * Once Square accepts the payment for processing,
         * the 30-minute inventory reservation becomes a
         * committed order.
         */
        if (
            result.status ===
            "PROCESSING" ||
            result.status ===
            "SUCCEEDED"
        ) {
            await finalizeOrderReservationsAfterPaymentAccepted(
                order.id,
            );
        }

        return {
            paymentId:
                payment.id,

            providerPaymentId:
                result.providerPaymentId,

            status:
                result.status,
        };
    } catch (error) {
        if (
            error instanceof
            PaymentProviderError
        ) {
            throw error;
        }

        console.error(
            "Square ACH payment processing failed:",
            error,
        );

        throw new PaymentProviderError(
            "Unable to process the ACH payment.",
        );
    }
}