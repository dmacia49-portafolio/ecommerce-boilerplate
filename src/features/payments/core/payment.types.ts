export type PaymentMethod =
    | "ACH"
    | "CARD"
    | "GOOGLE_PAY"
    | "APPLE_PAY"
    | "PAYPAL"
    | "VENMO";

export type PaymentProvider =
    | "BRAINTREE"
    | "STRIPE"
    | "PAYPAL"
    | "SQUARE";

export type PaymentRequest = {
    orderId: string;
    orderNumber: string;

    amount: number;
    currency: string;

    customerEmail: string;

    method: PaymentMethod;
};

export type PaymentResult = {
    provider: PaymentProvider;
    method: PaymentMethod;

    providerPaymentId: string;

    status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";

    redirectUrl?: string;
};