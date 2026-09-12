export type StorefrontProduct = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;

    imageUrl: string | null;

    price: number;
    compareAtPrice: number | null;
    currency: string;

    inStock: boolean;
    stockQuantity: number;

    variantCount: number;
};

export type StorefrontProductImage = {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
};

export type StorefrontProductCategory = {
    id: string;
    name: string;
    slug: string;
};

export type StorefrontProductVariant = {
    id: string;
    name: string;
    sku: string;

    price: number;
    compareAtPrice: number | null;
    currency: string;

    inStock: boolean;
    stockQuantity: number;
};

export type StorefrontProductDetail = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;

    images: StorefrontProductImage[];
    categories: StorefrontProductCategory[];
    variants: StorefrontProductVariant[];
};