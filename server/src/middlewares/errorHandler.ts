import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error caught by middleware:", err);

  const status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle Prisma-specific errors with user-friendly messages
  if (err.code === "P2002") {
    // Unique constraint violation
    message = "A record with this value already exists.";
  } else if (err.code === "P2025") {
    // Record not found
    message = "The requested record was not found.";
  } else if (err.name === "PrismaClientInitializationError" || err.code === "ECONNREFUSED") {
    message = "Database connection failed. Please try again later.";
  } else if (err.name === "PrismaClientKnownRequestError" || err.name === "PrismaClientValidationError") {
    message = "A database error occurred. Please try again later.";
  }

  res.status(status).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
