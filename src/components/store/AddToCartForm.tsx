"use client";

import { useActionState } from "react";

import {
  addToCartAction,
  type AddToCartState,
} from "@/features/cart/cart.actions";

import type { StorefrontProductVariant } from "@/features/products/product.types";

type AddToCartFormProps = {
  variants: StorefrontProductVariant[];
};

const initialState: AddToCartState = {
  error: null,
};

export function AddToCartForm({ variants }: AddToCartFormProps) {
  const availableVariants = variants.filter((variant) => variant.inStock);

  const [state, formAction, pending] = useActionState(
    addToCartAction,
    initialState,
  );

  if (availableVariants.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          This product is currently out of stock.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
    >
      <div>
        <label
          htmlFor="variantId"
          className="mb-2 block text-sm font-medium text-zinc-950 dark:text-white"
        >
          Product option
        </label>

        <select
          id="variantId"
          name="variantId"
          required
          defaultValue={availableVariants[0]?.id}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          {availableVariants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} —{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: variant.currency,
              }).format(variant.price)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="quantity"
          className="mb-2 block text-sm font-medium text-zinc-950 dark:text-white"
        >
          Quantity
        </label>

        <input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          max="99"
          defaultValue="1"
          required
          className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="text-sm font-medium text-red-600 dark:text-red-400"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-950 px-5 py-3 font-medium text-white transition enabled:cursor-pointer enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:enabled:hover:bg-zinc-200"
      >
        {pending ? "Adding..." : "Add to cart"}
      </button>
    </form>
  );
}
