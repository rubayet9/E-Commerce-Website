import { Request, Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

// Helper to calculate facets for a search query
async function calculateFacets(baseWhere: any) {
  // Fetch all matching products with their categories and variants to compile facet counts
  const allMatching = await prisma.product.findMany({
    where: baseWhere,
    select: {
      basePrice: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        select: {
          color: true,
          size: true,
          priceOverride: true,
        },
      },
    },
  });

  const categories: { [key: string]: { id: string; name: string; slug: string; count: number } } = {};
  const colors: { [key: string]: number } = {};
  const sizes: { [key: string]: number } = {};
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  allMatching.forEach((prod) => {
    // 1. Category Count
    const cat = prod.category;
    if (!categories[cat.id]) {
      categories[cat.id] = { id: cat.id, name: cat.name, slug: cat.slug, count: 0 };
    }
    categories[cat.id].count += 1;

    // 2. Base Price
    const baseP = Number(prod.basePrice);
    if (baseP < minPrice) minPrice = baseP;
    if (baseP > maxPrice) maxPrice = baseP;

    // 3. Variant details
    prod.variants.forEach((v) => {
      // Color count
      if (v.color) {
        colors[v.color] = (colors[v.color] || 0) + 1;
      }
      // Size count
      if (v.size) {
        sizes[v.size] = (sizes[v.size] || 0) + 1;
      }
      // Price bounds including overrides
      if (v.priceOverride) {
        const vPrice = Number(v.priceOverride);
        if (vPrice < minPrice) minPrice = vPrice;
        if (vPrice > maxPrice) maxPrice = vPrice;
      }
    });
  });

  return {
    categories: Object.values(categories),
    colors: Object.entries(colors).map(([name, count]) => ({ name, count })),
    sizes: Object.entries(sizes).map(([name, count]) => ({ name, count })),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === -Infinity ? 0 : maxPrice,
    },
  };
}

// Get products with filtering, pagination and dynamic facets
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const colors = req.query.colors as string | undefined;
  const sizes = req.query.sizes as string | undefined;
  const tags = req.query.tags as string | undefined;
  const minPrice = req.query.minPrice as string | undefined;
  const maxPrice = req.query.maxPrice as string | undefined;
  const sort = req.query.sort as string | undefined;
  const page = (req.query.page as string) || "1";
  const limit = (req.query.limit as string) || "12";

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  // Base query filter without color, size, and price facets (to compute open facets)
  const baseWhere: any = { isActive: true };

  if (search) {
    baseWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    baseWhere.category = { slug: category };
  }

  // Refined filter where all facets are applied
  const refinedWhere: any = { ...baseWhere };

  if (tags) {
    const tagList = tags.split(",");
    refinedWhere.tags = { hasSome: tagList };
  }

  // Handle color & size refinement lists
  const variantConditions: any[] = [];
  if (colors) {
    const colorList = colors.split(",");
    variantConditions.push({ color: { in: colorList } });
  }
  if (sizes) {
    const sizeList = sizes.split(",");
    variantConditions.push({ size: { in: sizeList } });
  }

  if (variantConditions.length > 0) {
    refinedWhere.variants = {
      some: {
        AND: variantConditions,
      },
    };
  }

  // Handle price bounds refinement
  if (minPrice || maxPrice) {
    const priceFilter: any = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);

    refinedWhere.basePrice = priceFilter;
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") {
    orderBy = { basePrice: "asc" };
  } else if (sort === "price_desc") {
    orderBy = { basePrice: "desc" };
  } else if (sort === "name_asc") {
    orderBy = { name: "asc" };
  }

  // Fetch count and matching items
  const [totalItems, products] = await prisma.$transaction([
    prisma.product.count({ where: refinedWhere }),
    prisma.product.findMany({
      where: refinedWhere,
      include: {
        category: true,
        variants: true,
      },
      orderBy,
      skip,
      take: parsedLimit,
    }),
  ]);

  // Dynamic facet aggregation calculations based on the base search query
  const facets = await calculateFacets(baseWhere);

  res.json({
    success: true,
    data: products,
    pagination: {
      total: totalItems,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(totalItems / parsedLimit),
    },
    facets,
  });
});

// Get a single product details by Slug
export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found.");
  }

  res.json({ success: true, data: product });
});

// Create product with variants (admin route / seeding helper)
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, basePrice, images, categoryId, tags, variants } = req.body;

  if (!name || !slug || !basePrice || !categoryId) {
    res.status(400);
    throw new Error("Name, slug, basePrice and categoryId are required fields.");
  }

  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId as string },
  });

  if (!categoryExists) {
    res.status(404);
    throw new Error("Target category not found.");
  }

  // Transactionally create the product and its variants
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      basePrice: parseFloat(basePrice),
      images: images || [],
      categoryId,
      tags: tags || [],
      variants: {
        create: (variants || []).map((v: any) => ({
          sku: v.sku,
          color: v.color,
          size: v.size,
          stock: parseInt(v.stock || "0", 10),
          priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          images: v.images || [],
        })),
      },
    },
    include: {
      variants: true,
      category: true,
    },
  });

  res.status(201).json({ success: true, data: product });
});

// Update product with variants
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, slug, description, basePrice, images, categoryId, tags, variants } = req.body;

  if (!name || !slug || !basePrice || !categoryId) {
    res.status(400);
    throw new Error("Name, slug, basePrice and categoryId are required fields.");
  }

  const productExists = await prisma.product.findUnique({
    where: { id },
  });

  if (!productExists) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId as string },
  });

  if (!categoryExists) {
    res.status(404);
    throw new Error("Target category not found.");
  }

  // 1. Delete all existing variants first
  await prisma.productVariant.deleteMany({
    where: { productId: id },
  });

  // 2. Update product details & create new variants
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      basePrice: parseFloat(basePrice),
      images: images || [],
      categoryId,
      tags: tags || [],
      variants: {
        create: (variants || []).map((v: any) => ({
          sku: v.sku,
          color: v.color,
          size: v.size,
          stock: parseInt(v.stock || "0", 10),
          priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          images: v.images || [],
        })),
      },
    },
    include: {
      variants: true,
      category: true,
    },
  });

  res.json({ success: true, data: updatedProduct });
});

// Soft delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const productExists = await prisma.product.findUnique({
    where: { id },
  });

  if (!productExists) {
    res.status(404);
    throw new Error("Product not found.");
  }

  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ success: true, message: "Product deleted successfully.", data: deletedProduct });
});

