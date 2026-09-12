import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/store/ProductDetail";
import { getStorefrontProductBySlug } from "@/features/products/product.service";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <ProductDetail product={product} />
      </div>
    </main>
  );
}
