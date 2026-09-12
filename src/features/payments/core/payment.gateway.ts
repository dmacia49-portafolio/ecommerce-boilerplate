import type {
    PaymentMethod,
    PaymentProvider,
    PaymentRequest,
    PaymentResult,
} from "./payment.types";

export interface PaymentGateway {
    readonly provider: PaymentProvider;

    supports(
        method: PaymentMethod,
    ): boolean;

    createPayment(
        request: PaymentRequest,
    ): Promise<PaymentResult>;
}