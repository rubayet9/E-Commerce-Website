import { Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/authMiddleware";

// POST /api/favourites — Add product to favourites
export const addFavourite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  if (!productId) {
    res.status(400).json({ success: false, error: "productId is required." });
    return;
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ success: false, error: "Product not found." });
    return;
  }

  // Check if already favourited
  const existing = await prisma.favourite.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    res.json({ success: true, message: "Already in favourites.", data: existing });
    return;
  }

  const favourite = await prisma.favourite.create({
    data: { userId, productId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          images: true,
          tags: true,
        },
      },
    },
  });

  res.status(201).json({ success: true, message: "Added to favourites.", data: favourite });
});

// DELETE /api/favourites/:productId — Remove from favourites
export const removeFavourite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const productId = req.params.productId as string;

  const existing = await prisma.favourite.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!existing) {
    res.status(404).json({ success: false, error: "Not in favourites." });
    return;
  }

  await prisma.favourite.delete({
    where: { id: existing.id },
  });

  res.json({ success: true, message: "Removed from favourites." });
});

// GET /api/favourites — Get user's favourites list
export const getFavourites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const favourites = await prisma.favourite.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          images: true,
          tags: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: favourites });
});
