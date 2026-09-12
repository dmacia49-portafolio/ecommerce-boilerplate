import { ProductCard } from "@/components/store/ProductCard";
import { getStorefrontProducts } from "@/features/products/product.service";

export default async function StorefrontPage() {
  const products = await getStorefrontProducts();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Demo Store
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Products
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Demo products loaded directly from PostgreSQL through the reusable
            e-commerce boilerplate.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400">
              No active products are available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
