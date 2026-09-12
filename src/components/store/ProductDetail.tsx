import Link from "next/link";
import { AddToCartForm } from "@/components/store/AddToCartForm";

import type { StorefrontProductDetail } from "@/features/products/product.types";

type ProductDetailProps = {
  product: StorefrontProductDetail;
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">Product image</p>

            {product.images[0] && (
              <p className="mt-2 text-xs text-zinc-400">
                {product.images[0].url}
              </p>
            )}
          </div>
        </div>

        {product.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images.map((image) => (
              <div
                key={image.id}
                className="flex aspect-square items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
              >
                Image
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-7">
        <div>
          {product.brand && (
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              {product.brand}
            </p>
          )}

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {product.name}
          </h1>
        </div>

        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <p className="leading-7 text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        )}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-white">
            Available options
          </h2>

          {product.variants.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">
                This product is currently unavailable.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {variant.name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      SKU: {variant.sku}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-zinc-950 dark:text-white">
                        {formatPrice(variant.price, variant.currency)}
                      </span>

                      {variant.compareAtPrice !== null && (
                        <span className="text-sm text-zinc-400 line-through">
                          {formatPrice(
                            variant.compareAtPrice,
                            variant.currency,
                          )}
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-1 text-xs ${
                        variant.inStock
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {variant.inStock
                        ? `${variant.stockQuantity} available`
                        : "Out of stock"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AddToCartForm variants={product.variants} />

        <Link
          href="/"
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          ← Back to products
        </Link>
      </section>
    </div>
  );
}
