import {
    findActiveProductBySlug,
    findActiveProducts,
} from "./product.repository";

import type {
    StorefrontProduct,
    StorefrontProductDetail,
} from "./product.types";

export async function getStorefrontProducts(): Promise<
    StorefrontProduct[]
> {
    const products = await findActiveProducts();

    return products.flatMap((product) => {
        const lowestPriceVariant = product.variants[0];

        if (!lowestPriceVariant) {
            return [];
        }

        const totalStock = product.variants.reduce((total, variant) => {
            if (!variant.inventory) {
                return total;
            }

            const available =
                variant.inventory.quantityAvailable -
                variant.inventory.quantityReserved;

            return total + Math.max(available, 0);
        }, 0);

        const primaryImage =
            product.images.find((image) => image.isPrimary) ??
            product.images[0] ??
            null;

        return [
            {
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                brand: product.brand,

                imageUrl: primaryImage?.url ?? null,

                price: Number(lowestPriceVariant.price),

                compareAtPrice: lowestPriceVariant.compareAtPrice
                    ? Number(lowestPriceVariant.compareAtPrice)
                    : null,

                currency: lowestPriceVariant.currency,

                inStock: totalStock > 0,
                stockQuantity: totalStock,

                variantCount: product.variants.length,
            },
        ];
    });
}

export async function getStorefrontProductBySlug(
    slug: string,
): Promise<StorefrontProductDetail | null> {
    const product = await findActiveProductBySlug(slug);

    if (!product) {
        return null;
    }

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,

        images: product.images.map((image) => ({
            id: image.id,
            url: image.url,
            altText: image.altText,
            isPrimary: image.isPrimary,
        })),

        categories: product.categories.map(({ category }) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
        })),

        variants: product.variants.map((variant) => {
            const available = variant.inventory
                ? Math.max(
                    variant.inventory.quantityAvailable -
                    variant.inventory.quantityReserved,
                    0,
                )
                : 0;

            return {
                id: variant.id,
                name: variant.name,
                sku: variant.sku,

                price: Number(variant.price),

                compareAtPrice: variant.compareAtPrice
                    ? Number(variant.compareAtPrice)
                    : null,

                currency: variant.currency,

                inStock: available > 0,
                stockQuantity: available,
            };
        }),
    };
}