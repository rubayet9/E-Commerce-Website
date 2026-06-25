import express from "express";
import path from "path";
import { exec } from "child_process";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import favouriteRoutes from "./routes/favouriteRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import prisma from "./config/db";

const app = express();

app.use(express.json());

// Enable CORS for frontend integration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/favourites", favouriteRoutes);

// Serve static uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Legacy profile endpoint (kept for backward compatibility)
app.get("/api/users/profile", async (req, res) => {
  try {
    const email = (req.query.email as string) || "rubayet@zendora.com";
    const user = await prisma.user.findUnique({
      where: { email },
      include: { addresses: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/debug/db-push", (req, res) => {
  console.log("Triggering on-demand prisma db push...");
  exec("npx prisma db push --accept-data-loss", (err, stdout, stderr) => {
    if (err) {
      console.error("Prisma db push failed:", err);
    } else {
      console.log("Prisma db push completed.");
    }
    res.json({
      success: !err,
      error: err ? err.message : null,
      stdout,
      stderr,
    });
  });
});

app.get("/health", async (req, res) => {
  try {
    // Perform a simple database connection check
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      message: "E-commerce API server is running.",
      database: "connected"
    });
  } catch (err: any) {
    console.error("Database connection check failed on /health:", err);
    res.status(500).json({
      status: "error",
      message: "E-commerce API server is running, but database connection failed.",
      error: err.message || String(err)
    });
  }
});

// Catch-all Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} (${process.env.NODE_ENV || "development"})`);

  // Auto-seed database if it is empty
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("Database is empty. Running auto-seeding...");
      const seedCmd = process.env.NODE_ENV === "production"
        ? "node dist/prisma/seed.js"
        : "npx ts-node prisma/seed.ts";
      exec(seedCmd, (err, stdout, stderr) => {
        if (err) {
          console.error("Auto-seeding failed:", err.message);
          if (stderr) console.error("Seed stderr:", stderr);
        } else {
          console.log("Auto-seeding completed successfully.");
          if (stdout) console.log(stdout);
        }
      });
    } else {
      console.log(`Database already has ${userCount} users. Skipping seeding.`);
    }
  } catch (dbError: any) {
    console.error("Failed to check or seed database at startup:", dbError.message || dbError);
  }
});

export default app;
