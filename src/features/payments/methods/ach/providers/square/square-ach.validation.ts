import { z } from "zod";

export const squareAchPaymentRequestSchema =
    z.object({
        orderNumber: z
            .string()
            .trim()
            .min(1)
            .max(100),

        sourceToken: z
            .string()
            .trim()
            .min(1)
            .max(500),
    });

export type SquareAchPaymentRequest =
    z.infer<
        typeof squareAchPaymentRequestSchema
    >;