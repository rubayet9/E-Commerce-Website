import ProductDetailClient from "./ProductDetailClient";

export async function generateStaticParams() {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((product: any) => ({
        slug: product.slug,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch slugs for generateStaticParams:", error);
  }

  // Fallback defaults to support build/dev when API is not running
  return [
    { slug: "classic-print-kurti" },
    { slug: "bangladesh-fan-jersey" },
    { slug: "luxury-pique-polo" },
    { slug: "premium-crewneck-tshirt" },
  ];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <ProductDetailClient slug={resolvedParams.slug} />;
}
