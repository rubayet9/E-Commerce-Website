const isProd = process.env.NODE_ENV === "production";

// The path prefix for assets and routes on GitHub Pages
export const BASE_PATH = isProd ? "/E-Commerce-Website" : "";

// The Express API backend URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
