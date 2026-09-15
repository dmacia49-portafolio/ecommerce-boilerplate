import Link from "next/link";

type ProcessingPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { orderNumber } = await params;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Payment processing
          </p>

          <h1 className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">
            Your ACH payment was submitted
          </h1>

          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Your bank transfer is now being processed.
          </p>

          <p className="mt-3 text-sm text-zinc-500">
            Order <span className="font-medium">{orderNumber}</span>
          </p>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ACH payments can take time to settle. Your order will be updated
              when the payment provider reports the final result.
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Return to store
          </Link>
        </div>
      </div>
    </main>
  );
}
