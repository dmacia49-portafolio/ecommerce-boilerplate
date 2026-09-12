import Link from "next/link";
import { notFound } from "next/navigation";

import { getCheckoutOrderSummary } from "@/features/checkout/checkout.service";

import { cancelCheckoutAction } from "@/features/checkout/checkout.actions";

type CheckoutOrderPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export default async function CheckoutOrderPage({
  params,
}: CheckoutOrderPageProps) {
  const { orderNumber } = await params;

  const order = await getCheckoutOrderSummary(orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-700 dark:text-green-400">
            Inventory reserved
          </p>

          <h1 className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">
            Your items are reserved
          </h1>

          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Order <span className="font-medium">{order.orderNumber}</span>
          </p>

          {order.reservationExpiresAt && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Reservation expires at
              </p>

              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {order.reservationExpiresAt.toLocaleString()}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-5 border-b border-zinc-200 pb-4 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-950 dark:text-white">
                    {item.productName}
                  </p>

                  {item.variantName && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {item.variantName}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-zinc-400">
                    {item.quantity} ×{" "}
                    {formatPrice(item.unitPrice, order.currency)}
                  </p>
                </div>

                <p className="font-medium text-zinc-950 dark:text-white">
                  {formatPrice(item.total, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between text-xl font-semibold text-zinc-950 dark:text-white">
            <span>Total</span>

            <span>{formatPrice(order.grandTotal, order.currency)}</span>
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-5 text-center dark:border-zinc-700">
            <p className="font-medium text-zinc-950 dark:text-white">
              Stripe payment comes next
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              For now this page confirms that PostgreSQL successfully reserved
              the inventory.
            </p>
          </div>
          <form action={cancelCheckoutAction} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Cancel checkout
            </button>
          </form>

          <p className="mt-2 text-center text-xs text-zinc-500">
            Cancelling checkout immediately releases the reserved inventory.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Return to store
          </Link>
        </div>
      </div>
    </main>
  );
}
