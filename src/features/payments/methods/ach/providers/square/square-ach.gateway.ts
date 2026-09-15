import type {
    PaymentGateway,
} from "../../../../core/payment.gateway";

import type {
    PaymentMethod,
    PaymentRequest,
    PaymentResult,
} from "../../../../core/payment.types";

import {
    PaymentProviderError,
} from "../../../../shared/payment.errors";

import {
    squareClient,
} from "@/features/payments/providers/square/square.client";

export class SquareAchGateway
    implements PaymentGateway {
    readonly provider =
        "SQUARE" as const;

    supports(
        method: PaymentMethod,
    ): boolean {
        return method === "ACH";
    }

    async createPayment(
        request: PaymentRequest,
    ): Promise<PaymentResult> {
        if (request.method !== "ACH") {
            throw new PaymentProviderError(
                "Square ACH gateway only supports ACH payments.",
            );
        }

        if (request.currency !== "USD") {
            throw new PaymentProviderError(
                "Square ACH currently supports only USD orders.",
            );
        }

        if (
            !Number.isSafeInteger(
                request.amountCents,
            ) ||
            request.amountCents <= 0
        ) {
            throw new PaymentProviderError(
                "Payment amount is invalid.",
            );
        }

        const locationId =
            process.env.SQUARE_LOCATION_ID;

        if (!locationId) {
            throw new PaymentProviderError(
                "SQUARE_LOCATION_ID is not configured.",
            );
        }

        try {
            const response =
                await squareClient.payments.create({
                    sourceId:
                        request.sourceToken,

                    idempotencyKey:
                        request.idempotencyKey,

                    amountMoney: {
                        amount:
                            BigInt(
                                request.amountCents,
                            ),

                        currency: "USD",
                    },

                    locationId,

                    referenceId:
                        request.orderNumber,

                    autocomplete: true,
                });

            const payment =
                response.payment;

            if (
                !payment ||
                !payment.id
            ) {
                throw new PaymentProviderError(
                    "Square did not return a payment.",
                );
            }

            return {
                provider: "SQUARE",

                method: "ACH",

                providerPaymentId:
                    payment.id,

                status:
                    mapSquarePaymentStatus(
                        payment.status,
                    ),
            };
        } catch (error) {
            if (
                error instanceof
                PaymentProviderError
            ) {
                throw error;
            }

            console.error(
                "Square ACH payment error:",
                error,
            );

            throw new PaymentProviderError(
                "Square was unable to create the ACH payment.",
            );
        }
    }
}

function mapSquarePaymentStatus(
    status:
        | string
        | undefined,
): PaymentResult["status"] {
    switch (status) {
        case "COMPLETED":
            return "SUCCEEDED";

        case "PENDING":
        case "APPROVED":
            return "PROCESSING";

        case "FAILED":
        case "CANCELED":
            return "FAILED";

        default:
            return "PENDING";
    }
}

export const squareAchGateway =
    new SquareAchGateway();