import { prisma } from "@/lib/db/prisma";

export async function findOrderForSquareAch(
    orderNumber: string,
    checkoutToken: string,
) {
    return prisma.order.findFirst({
        where: {
            orderNumber,
            checkoutToken,

            status: "PENDING",
            paymentStatus: "PENDING",
        },

        select: {
            id: true,
            orderNumber: true,
            grandTotal: true,
            currency: true,
        },
    });
}

export async function findReusableSquareAchPayment(
    orderId: string,
) {
    return prisma.payment.findFirst({
        where: {
            orderId,

            provider: "SQUARE",
            method: "ACH",

            status: {
                in: [
                    "PENDING",
                    "PROCESSING",
                ],
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });
}

type CreateSquareAchPaymentInput = {
    id: string;
    orderId: string;
    amount: string;
    currency: string;
    idempotencyKey: string;
};

export async function createSquareAchPayment(
    input: CreateSquareAchPaymentInput,
) {
    return prisma.payment.create({
        data: {
            id: input.id,

            orderId: input.orderId,

            provider: "SQUARE",
            method: "ACH",

            idempotencyKey:
                input.idempotencyKey,

            amount: input.amount,
            currency: input.currency,

            status: "PENDING",
        },
    });
}

type UpdateSquarePaymentInput = {
    paymentId: string;
    providerPaymentId: string;

    status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";
};

export async function updateSquarePayment(
    input: UpdateSquarePaymentInput,
) {
    return prisma.payment.update({
        where: {
            id: input.paymentId,
        },

        data: {
            providerPaymentId:
                input.providerPaymentId,

            status: input.status,
        },
    });
}