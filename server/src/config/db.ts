import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing.");
  // Instantiate PrismaClient as a fallback to avoid crash on import
  prisma = new PrismaClient();
} else {
  try {
    const isNeonOrSupabase = connectionString.includes("neon.tech") || connectionString.includes("supabase.co");
    const pool = new Pool({
      connectionString,
      ssl: isNeonOrSupabase ? { rejectUnauthorized: false } : undefined,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle database client:", err);
    });

    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to initialize database pool:", error);
    prisma = new PrismaClient();
  }
}

export default prisma;

