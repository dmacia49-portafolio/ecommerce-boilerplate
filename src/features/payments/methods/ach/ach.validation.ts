import { z } from "zod";

export const achPaymentSelectionSchema =
    z.object({
        paymentMethod:
            z.literal("ACH"),
    });

export type AchPaymentSelectionInput =
    z.infer<
        typeof achPaymentSelectionSchema
    >;