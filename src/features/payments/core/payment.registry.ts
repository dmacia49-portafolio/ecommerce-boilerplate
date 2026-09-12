import type {
    PaymentMethod,
    PaymentProvider,
} from "./payment.types";

import type {
    PaymentGateway,
} from "./payment.gateway";

import {
    PaymentProviderError,
    UnsupportedPaymentMethodError,
} from "../shared/payment.errors";

export class PaymentGatewayRegistry {
    private readonly gateways =
        new Map<
            PaymentProvider,
            PaymentGateway
        >();

    register(
        gateway: PaymentGateway,
    ) {
        if (
            this.gateways.has(
                gateway.provider,
            )
        ) {
            throw new PaymentProviderError(
                `Payment provider ${gateway.provider} is already registered.`,
            );
        }

        this.gateways.set(
            gateway.provider,
            gateway,
        );
    }

    getByProvider(
        provider: PaymentProvider,
    ): PaymentGateway {
        const gateway =
            this.gateways.get(provider);

        if (!gateway) {
            throw new PaymentProviderError(
                `Payment provider ${provider} is not registered.`,
            );
        }

        return gateway;
    }

    getForMethod(
        method: PaymentMethod,
    ): PaymentGateway {
        for (
            const gateway of
            this.gateways.values()
        ) {
            if (
                gateway.supports(method)
            ) {
                return gateway;
            }
        }

        throw new UnsupportedPaymentMethodError(
            method,
        );
    }

    getAllForMethod(
        method: PaymentMethod,
    ): PaymentGateway[] {
        return Array.from(
            this.gateways.values(),
        ).filter((gateway) =>
            gateway.supports(method),
        );
    }

    isMethodSupported(
        method: PaymentMethod,
    ): boolean {
        return Array.from(
            this.gateways.values(),
        ).some((gateway) =>
            gateway.supports(method),
        );
    }
}

export const paymentGatewayRegistry =
    new PaymentGatewayRegistry(); 