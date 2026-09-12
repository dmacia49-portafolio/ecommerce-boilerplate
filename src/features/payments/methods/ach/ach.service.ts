import {
    paymentGatewayRegistry,
} from "../../core/payment.registry";

import type {
    PaymentGateway,
} from "../../core/payment.gateway";

import type {
    AchPaymentAvailability,
} from "./ach.types";

import {
    ACH_PAYMENT_METHOD,
} from "./ach.types";

export function getAchPaymentAvailability():
    AchPaymentAvailability {
    const gateways =
        paymentGatewayRegistry.getAllForMethod(
            ACH_PAYMENT_METHOD,
        );

    return {
        method:
            ACH_PAYMENT_METHOD,

        available:
            gateways.length > 0,

        providers:
            gateways.map(
                (gateway) =>
                    gateway.provider,
            ),
    };
}

export function getAchPaymentGateway():
    PaymentGateway {
    return paymentGatewayRegistry.getForMethod(
        ACH_PAYMENT_METHOD,
    );
}