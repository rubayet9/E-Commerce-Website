import { Request, Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

// Get all categories (either flat or as a hierarchical tree)
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { tree } = req.query;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  if (tree === "true") {
    // Build recursive parent-child tree structure in memory
    const categoryMap: { [key: string]: any } = {};
    
    categories.forEach((cat) => {
      categoryMap[cat.id] = { ...cat, subCategories: [] };
    });

    const roots: any[] = [];

    categories.forEach((cat) => {
      const node = categoryMap[cat.id];
      if (cat.parentId) {
        const parent = categoryMap[cat.parentId];
        if (parent) {
          parent.subCategories.push(node);
        } else {
          // Fallback if parent not found (orphaned child)
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return res.json({ success: true, data: roots });
  }

  return res.json({ success: true, data: categories });
});

// Create a new category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, image, parentId } = req.body;

  if (!name || !slug) {
    res.status(400);
    throw new Error("Name and slug are required fields.");
  }

  // Verify parent category exists if parentId is provided
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      res.status(404);
      throw new Error(`Parent category with ID ${parentId} not found.`);
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      image,
      parentId,
    },
  });

  res.status(201).json({ success: true, data: category });
});

// Update a category
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, slug, description, image, parentId } = req.body;

  const categoryExists = await prisma.category.findUnique({
    where: { id },
  });

  if (!categoryExists) {
    res.status(404);
    throw new Error(`Category with ID ${id} not found.`);
  }

  // Prevent setting itself as parent
  if (parentId && parentId === id) {
    res.status(400);
    throw new Error("A category cannot be its own parent.");
  }

  // Verify parent category exists if parentId is provided
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      res.status(404);
      throw new Error(`Parent category with ID ${parentId} not found.`);
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      image,
      parentId: parentId || null,
    },
  });

  res.json({ success: true, data: updatedCategory });
});

// Delete a category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const categoryExists = await prisma.category.findUnique({
    where: { id },
    include: { products: true, subCategories: true },
  });

  if (!categoryExists) {
    res.status(404);
    throw new Error(`Category with ID ${id} not found.`);
  }

  if (((categoryExists as any).products || []).length > 0) {
    res.status(400);
    throw new Error(`Cannot delete category. There are ${(categoryExists as any).products.length} products associated with this category.`);
  }

  await prisma.category.delete({
    where: { id },
  });

  res.json({ success: true, message: "Category deleted successfully." });
});
