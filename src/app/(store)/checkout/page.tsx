import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CART_COOKIE_NAME } from "@/features/cart/cart.constants";

import { getAnonymousCart } from "@/features/cart/cart.service";

import { startCheckoutAction } from "@/features/checkout/checkout.actions";

type CheckoutPageProps = {
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

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;

  const rawError = params.error;

  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const cookieStore = await cookies();

  const cartToken = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!cartToken) {
    redirect("/cart");
  }

  const cart = await getAnonymousCart(cartToken);

  if (!cart) {
    redirect("/cart");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <Link
            href="/cart"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
          >
            ← Back to cart
          </Link>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Checkout
          </h1>

          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Inventory will be reserved for 30 minutes when you continue.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Contact information
            </h2>

            <form action={startCheckoutAction} className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-950 dark:text-white"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  We'll associate this email with the pending order.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Clicking continue will attempt to reserve all items in this cart
                for 30 minutes.
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Reserve items and continue
              </button>
            </form>
          </section>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Order summary
            </h2>

            <div className="mt-6 space-y-5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-5">
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-white">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {item.variantName}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      Qty {item.quantity}
                    </p>
                  </div>

                  <p className="font-medium text-zinc-950 dark:text-white">
                    {formatPrice(item.lineTotal, item.currency)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <div className="flex justify-between font-semibold text-zinc-950 dark:text-white">
                <span>Estimated subtotal</span>

                <span>{formatPrice(cart.subtotal, cart.currency)}</span>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Final prices and inventory are checked again on the server when
                checkout begins.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
