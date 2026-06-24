import { Response } from "express";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/admin/users — List all users (SUPER_ADMIN only)
export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: users });
});

// PUT /api/admin/users/:id/role — Update user role (SUPER_ADMIN only)
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;

  const validRoles = ["CUSTOMER", "ADMIN", "STAFF"];

  if (!role || !validRoles.includes(role)) {
    res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    return;
  }

  // Prevent changing own role
  if (req.user?.id === id) {
    res.status(400).json({ success: false, error: "You cannot change your own role." });
    return;
  }

  const targetUser = await prisma.user.findUnique({ where: { id: id as string } });
  if (!targetUser) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }

  // Prevent changing another SUPER_ADMIN's role
  if (String(targetUser.role) === "SUPER_ADMIN") {
    res.status(403).json({ success: false, error: "Cannot modify a Super Admin account." });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: id as string },
    data: { role: role as any },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  res.json({
    success: true,
    message: `User ${updatedUser.name} is now ${role}.`,
    data: updatedUser,
  });
});
