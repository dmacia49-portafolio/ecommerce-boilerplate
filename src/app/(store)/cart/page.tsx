import Link from "next/link";
import { cookies } from "next/headers";

import {
  clearCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from "@/features/cart/cart.actions";

import { CART_COOKIE_NAME } from "@/features/cart/cart.constants";

import { getAnonymousCart } from "@/features/cart/cart.service";

type CartPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const params = await searchParams;

  const rawError = params.error;

  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const cookieStore = await cookies();

  const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value;

  const cart = await getAnonymousCart(cartToken);

  if (!cart) {
    return (
      <main className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Your cart
          </h1>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Your cart is empty
            </h2>

            <p className="mt-2 text-zinc-500">Add a product to get started.</p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-zinc-950 px-5 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
            >
              Browse products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Your cart
            </h1>

            <p className="mt-2 text-zinc-500">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              Continue shopping
            </Link>

            <form action={clearCartAction}>
              <button
                type="submit"
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear cart
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="mt-10 space-y-4">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col justify-between gap-6 sm:flex-row">
                <div>
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="text-lg font-semibold text-zinc-950 hover:underline dark:text-white"
                  >
                    {item.productName}
                  </Link>

                  <p className="mt-1 text-sm text-zinc-500">
                    {item.variantName}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">SKU: {item.sku}</p>

                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Available stock: {item.availableStock}
                  </p>

                  {!item.available && (
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                      The requested quantity is no longer available.
                    </p>
                  )}
                </div>

                <div className="sm:text-right">
                  <p className="font-semibold text-zinc-950 dark:text-white">
                    {formatPrice(item.lineTotal, item.currency)}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {formatPrice(item.unitPrice, item.currency)} each
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <form
                  action={updateCartItemAction}
                  className="flex items-end gap-3"
                >
                  <input type="hidden" name="itemId" value={item.id} />

                  <div>
                    <label
                      htmlFor={`quantity-${item.id}`}
                      className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                    >
                      Quantity
                    </label>

                    <input
                      id={`quantity-${item.id}`}
                      name="quantity"
                      type="number"
                      min="1"
                      max="99"
                      defaultValue={item.quantity}
                      required
                      className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Update
                  </button>
                </form>

                <form action={removeCartItemAction}>
                  <input type="hidden" name="itemId" value={item.id} />

                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-8 ml-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex justify-between text-lg font-semibold text-zinc-950 dark:text-white">
            <span>Subtotal</span>

            <span>{formatPrice(cart.subtotal, cart.currency)}</span>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Taxes and shipping will be calculated during checkout.
          </p>

          <Link
            href="/checkout"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Checkout
          </Link>
        </section>
      </div>
    </main>
  );
}
