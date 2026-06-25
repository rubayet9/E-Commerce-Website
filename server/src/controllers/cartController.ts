import { Request, Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

// Helper to retrieve or create cart
async function getOrCreateCart(userId?: string, sessionToken?: string) {
  if (!userId && !sessionToken) {
    throw new Error("Either userId or sessionToken must be provided.");
  }

  // 1. Try finding by userId
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  // 2. Try finding by sessionToken
  if (sessionToken) {
    let cart = await prisma.cart.findUnique({
      where: { sessionToken },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionToken },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  throw new Error("Could not create cart.");
}

// GET cart details
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId ? (req.query.userId as string) : undefined;
  const sessionToken = req.query.sessionToken ? (req.query.sessionToken as string) : undefined;

  if (!userId && !sessionToken) {
    return res.status(400).json({ success: false, error: "Please provide a userId or sessionToken" });
  }

  const cart = await getOrCreateCart(userId, sessionToken);
  res.json({ success: true, data: cart });
});

// POST Add item to cart
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId ? (req.body.userId as string) : undefined;
  const sessionToken = req.body.sessionToken ? (req.body.sessionToken as string) : undefined;
  const productVariantId = req.body.productVariantId as string | undefined;
  const quantity = parseInt(req.body.quantity || "1", 10);

  if (!productVariantId) {
    res.status(400);
    throw new Error("productVariantId is required.");
  }

  // Verify variant exists and has sufficient stock
  const variant = await prisma.productVariant.findUnique({
    where: { id: productVariantId },
  });

  if (!variant) {
    res.status(404);
    throw new Error("Product variant not found.");
  }

  if (variant.stock < quantity) {
    res.status(400);
    throw new Error(`Insufficient stock. Only ${variant.stock} units available.`);
  }

  const cart = await getOrCreateCart(userId, sessionToken);

  // Check if item already exists in the cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productVariantId: {
        cartId: cart.id,
        productVariantId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    if (variant.stock < newQuantity) {
      res.status(400);
      throw new Error(`Cannot add more. Insufficient stock. Only ${variant.stock} units available in total.`);
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productVariantId,
        quantity,
      },
    });
  }

  // Refetch cart
  const updatedCart = await getOrCreateCart(userId, sessionToken);
  res.json({ success: true, data: updatedCart });
});

// PUT update cart item quantity
export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const cartItemId = req.params.cartItemId as string;
  const quantity = parseInt(req.body.quantity, 10);

  if (isNaN(quantity) || quantity <= 0) {
    res.status(400);
    throw new Error("Quantity must be a positive integer.");
  }

  const cartItem = (await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { variant: true },
  })) as any;

  if (!cartItem) {
    res.status(404);
    throw new Error("Cart item not found.");
  }

  if (cartItem.variant.stock < quantity) {
    res.status(400);
    throw new Error(`Only ${cartItem.variant.stock} items are in stock.`);
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  res.json({ success: true, data: updatedItem });
});

// DELETE remove item from cart
export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const cartItemId = req.params.cartItemId as string;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    res.status(404);
    throw new Error("Cart item not found.");
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  res.json({ success: true, message: "Item removed from cart." });
});

// POST Merge Guest Cart into User Cart
export const mergeCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId ? (req.body.userId as string) : undefined;
  const sessionToken = req.body.sessionToken ? (req.body.sessionToken as string) : undefined;

  if (!userId || !sessionToken) {
    res.status(400);
    throw new Error("Both userId and sessionToken are required to merge carts.");
  }

  // Find user and guest carts
  const guestCart = await prisma.cart.findUnique({
    where: { sessionToken },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    // Nothing to merge
    const userCart = await getOrCreateCart(userId, undefined);
    return res.json({ success: true, data: userCart });
  }

  const userCart = await getOrCreateCart(userId, undefined);

  // Merge items
  for (const item of guestCart.items) {
    const existingUserItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: userCart.id,
          productVariantId: item.productVariantId,
        },
      },
    });

    if (existingUserItem) {
      // Add quantities together
      await prisma.cartItem.update({
        where: { id: existingUserItem.id },
        data: { quantity: existingUserItem.quantity + item.quantity },
      });
    } else {
      // Move item to user cart
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        },
      });
    }
  }

  // Clear guest cart
  await prisma.cart.delete({
    where: { id: guestCart.id },
  });

  const finalCart = await getOrCreateCart(userId, undefined);
  res.json({ success: true, data: finalCart });
});
