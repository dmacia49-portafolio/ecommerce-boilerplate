import Link from "next/link";

export default function CheckoutCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold text-zinc-950 dark:text-white">
          Checkout cancelled
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Your reserved inventory was released and no payment was processed.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-zinc-950 px-5 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
        >
          Return to store
        </Link>
      </div>
    </main>
  );
}
