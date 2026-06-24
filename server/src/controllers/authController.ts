import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest, JWT_SECRET } from "../middlewares/authMiddleware";

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: "Name, email, and password are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    return;
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: { user, token },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: "Email and password are required." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user || !user.passwordHash) {
    res.status(401).json({ success: false, error: "Invalid email or password." });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, error: "This account has been deactivated." });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, error: "Invalid email or password." });
    return;
  }

  const token = generateToken(user.id);

  // Don't send passwordHash to client
  const { passwordHash, ...userData } = user;

  res.json({
    success: true,
    message: "Login successful.",
    data: { user: userData, token },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Not authenticated." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      addresses: true,
    },
  });

  if (!user) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }

  res.json({ success: true, data: user });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, error: "Email is required." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if user exists, but still return success for security
    res.json({ success: true, message: "If an account exists with this email, a reset code has been sent." });
    return;
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate any existing password reset OTPs
  await prisma.oTP.updateMany({
    where: { userId: user.id, purpose: "PASSWORD_RESET", isUsed: false },
    data: { isUsed: true },
  });

  // Create new OTP
  await prisma.oTP.create({
    data: {
      code,
      userId: user.id,
      purpose: "PASSWORD_RESET",
      expiresAt,
    },
  });

  // In production, send email here. For dev, return the code.
  res.json({
    success: true,
    message: "Password reset code has been generated.",
    // DEV ONLY: returning the code for testing
    resetCode: code,
  });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400).json({ success: false, error: "Email, code, and new password are required." });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(400).json({ success: false, error: "Invalid reset request." });
    return;
  }

  // Find valid OTP
  const otp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code,
      purpose: "PASSWORD_RESET",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    res.status(400).json({ success: false, error: "Invalid or expired reset code." });
    return;
  }

  // Hash new password and update user
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  res.json({ success: true, message: "Password reset successfully. You can now log in." });
});
