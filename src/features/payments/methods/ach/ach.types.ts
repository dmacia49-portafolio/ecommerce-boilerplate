import type {
    PaymentMethod,
    PaymentProvider,
} from "../../core/payment.types";

export const ACH_PAYMENT_METHOD =
    "ACH" satisfies PaymentMethod;

export type AchPaymentSelection = {
    method: "ACH";
};

export type AchPaymentAvailability = {
    method: "ACH";

    available: boolean;

    providers: PaymentProvider[];
};