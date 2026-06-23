import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <ProductDetailClient slug={resolvedParams.slug} />;
}
