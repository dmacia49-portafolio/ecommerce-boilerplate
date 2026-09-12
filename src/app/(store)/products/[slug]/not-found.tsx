import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          404
        </p>

        <h1 className="mt-3 text-4xl font-bold text-zinc-950 dark:text-white">
          Product not found
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          The product may have been removed, archived, or the address may be
          incorrect.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-zinc-950 px-5 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
        >
          Return to products
        </Link>
      </div>
    </main>
  );
}
