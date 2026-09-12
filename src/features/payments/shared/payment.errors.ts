export class PaymentError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "PaymentError";
    }
}

export class UnsupportedPaymentMethodError extends PaymentError {
    constructor(method: string) {
        super(
            `Payment method ${method} is not currently supported.`,
        );

        this.name =
            "UnsupportedPaymentMethodError";
    }
}

export class PaymentProviderError extends PaymentError {
    constructor(message: string) {
        super(message);

        this.name =
            "PaymentProviderError";
    }
}