import Link from "next/link";

import type { StorefrontProduct } from "@/features/products/product.types";

type ProductCardProps = {
  product: StorefrontProduct;
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = formatPrice(product.price, product.currency);

  const formattedComparePrice =
    product.compareAtPrice !== null
      ? formatPrice(product.compareAtPrice, product.currency)
      : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex aspect-square items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-800">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-500">Product image</p>

          {product.imageUrl && (
            <p className="mt-2 text-xs text-zinc-400">{product.imageUrl}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 p-5">
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {product.brand}
          </p>
        )}

        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          {product.name}
        </h2>

        {product.description && (
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              {product.variantCount > 1 && "From "}
              {formattedPrice}
            </span>

            {formattedComparePrice && (
              <span className="text-sm text-zinc-400 line-through">
                {formattedComparePrice}
              </span>
            )}
          </div>

          <p
            className={`mt-1 text-xs ${
              product.inStock
                ? "text-green-700 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {product.inStock
              ? `${product.stockQuantity} in stock`
              : "Out of stock"}
          </p>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          View product
        </Link>
      </div>
    </article>
  );
}
