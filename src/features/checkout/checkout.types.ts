export type CheckoutReservationResult = {
    orderId: string;
    orderNumber: string;
    checkoutToken: string;

    currency: string;
    subtotal: number;
    grandTotal: number;

    reservationExpiresAt: Date;
};

export type CheckoutOrderItem = {
    id: string;

    productName: string;
    variantName: string | null;
    sku: string;

    quantity: number;

    unitPrice: number;
    total: number;
};

export type CheckoutOrderSummary = {
    orderNumber: string;

    currency: string;

    subtotal: number;
    grandTotal: number;

    items: CheckoutOrderItem[];

    reservationExpiresAt: Date | null;
};