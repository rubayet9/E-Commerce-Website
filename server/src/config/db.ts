import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing.");
  // Instantiate PrismaClient as a fallback to avoid crash on import
  prisma = new PrismaClient({ adapter: new PrismaPg(new Pool()) });
} else {
  try {
    // Enable SSL for production/cloud databases (Render, Neon, Supabase, etc.)
    // Local connections (localhost) don't need SSL
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    const pool = new Pool({
      connectionString,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle database client:", err);
    });

    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to initialize database pool:", error);
    // Use dummy client to avoid crash on load
    prisma = new PrismaClient({ adapter: new PrismaPg(new Pool()) });
  }
}

export default prisma;

