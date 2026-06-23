import { Request, Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

// Place an order (uses Transactional stock update)
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.body.userId as string | undefined;
  const sessionToken = req.body.sessionToken as string | undefined;
  const street = req.body.street as string;
  const city = req.body.city as string;
  const postalCode = req.body.postalCode as string | undefined;
  const country = (req.body.country as string) || "Bangladesh";
  const zone = req.body.zone as string; // "INSIDE_DHAKA" or "OUTSIDE_DHAKA"
  const paymentMethod = req.body.paymentMethod as any; // "COD", "SSLCOMMERZ", "STRIPE"

  if (!zone || !paymentMethod || !street || !city) {
    res.status(400);
    throw new Error("Address (street, city, zone) and paymentMethod are required.");
  }

  if (!userId && !sessionToken) {
    res.status(400);
    throw new Error("Either userId or sessionToken is required to checkout.");
  }

  // Execute the entire checkout process in a database transaction
  const order = await prisma.$transaction(async (tx) => {
    // 1. Retrieve the cart
    const cart = await tx.cart.findFirst({
      where: userId ? { userId } : { sessionToken },
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

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty. Cannot place an order.");
    }

    // 2. Validate inventory stock levels and calculate prices
    let subTotal = 0;
    for (const item of cart.items) {
      if (item.variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${item.variant.product.name} (${item.variant.size} / ${item.variant.color}). Only ${item.variant.stock} units left.`
        );
      }
      
      const price = item.variant.priceOverride
        ? Number(item.variant.priceOverride)
        : Number(item.variant.product.basePrice);

      subTotal += price * item.quantity;
    }

    // Calculate shipping costs dynamically (e.g., Inside Dhaka vs Outside Dhaka)
    const shippingCost = zone === "INSIDE_DHAKA" ? 60.0 : 120.0;
    const totalAmount = subTotal + shippingCost;

    // 3. Deduct stock for all items
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 4. Manage user address
    let addressId: string;
    if (userId) {
      // Find or create address for the authenticated user
      let address = await tx.address.findFirst({
        where: { userId, street, city, zone },
      });

      if (!address) {
        address = await tx.address.create({
          data: {
            userId,
            street,
            city,
            postalCode,
            country,
            zone,
            isDefault: true,
          },
        });
      }
      addressId = address.id;
    } else {
      // For guest users, we create an address record linked to a temporary dummy user or create one on the fly.
      // Alternatively, let's create a guest profile for the order.
      // To bypass requiring a foreign key Address for guest checkout, we can create a temporary placeholder user:
      let guestUser = await tx.user.findFirst({
        where: { email: `guest_${sessionToken}@fabrilife-guest.com` },
      });

      if (!guestUser) {
        guestUser = await tx.user.create({
          data: {
            email: `guest_${sessionToken}@fabrilife-guest.com`,
            name: "Guest Shopper",
            role: "CUSTOMER",
          },
        });
      }

      const address = await tx.address.create({
        data: {
          userId: guestUser.id,
          street,
          city,
          postalCode,
          country,
          zone,
        },
      });
      addressId = address.id;
    }

    // 5. Generate Order Number
    const orderNumber = `FL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Create the Order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod,
        addressId,
        subTotal,
        shippingCost,
        totalAmount,
        items: {
          create: cart.items.map((item) => {
            const price = item.variant.priceOverride
              ? Number(item.variant.priceOverride)
              : Number(item.variant.product.basePrice);
            return {
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              priceAtPurchase: price,
            };
          }),
        },
      },
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

    // 7. Clear the Cart items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    data: order,
  });
});

// GET order by Order Number (for tracking)
export const getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
  const orderNumber = req.params.orderNumber as string;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
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
      address: true,
    },
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  res.json({ success: true, data: order });
});

// GET all orders for a User (dashboard)
export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  const orders = await prisma.order.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: orders });
});
