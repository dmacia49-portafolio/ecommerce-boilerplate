export type StorefrontCartItem = {
    id: string;

    productName: string;
    productSlug: string;

    variantId: string;
    variantName: string;
    sku: string;

    quantity: number;

    unitPrice: number;
    lineTotal: number;
    currency: string;

    availableStock: number;
    available: boolean;
};

export type StorefrontCart = {
    id: string;

    itemCount: number;

    subtotal: number;
    currency: string;

    items: StorefrontCartItem[];
};