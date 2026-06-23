import express from "express";
import path from "path";
import { exec } from "child_process";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import uploadRoutes from "./routes/uploadRoutes";
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
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// Serve static uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
  console.log(`Server is running on port ${PORT}`);

  // Auto-seed database if it is empty
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("Database is empty. Running auto-seeding...");
      exec("node dist/prisma/seed.js", (err, stdout, stderr) => {
        if (err) {
          console.error("Auto-seeding failed:", err);
        } else {
          console.log("Auto-seeding completed successfully:", stdout);
        }
      });
    } else {
      console.log(`Database already has ${userCount} users. Skipping seeding.`);
    }
  } catch (dbError) {
    console.error("Failed to check or seed database at startup:", dbError);
  }
});

export default app;
