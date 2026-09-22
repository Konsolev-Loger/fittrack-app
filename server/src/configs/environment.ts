import "dotenv/config";
import { emailAuthEnabled } from "./features";
import { validateMailEnvironment } from "../services/mailService";

export const production = process.env.NODE_ENV === "production";
export const allowedOrigins = (process.env.FRONTEND_ORIGINS || (production ? "" : "http://127.0.0.1:5173,http://localhost:5173"))
 .split(",").map(value => value.trim()).filter(Boolean);

export function validateEnvironment() {
 if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
 for (const key of ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
  const value = process.env[key];
  if (!value || (production && (value.length < 32 || value.startsWith("replace-")))) throw new Error(key + " must be set (at least 32 characters in production)");
 }
 if (production && process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) throw new Error("JWT secrets must be different");
 if (production && !allowedOrigins.length) throw new Error("FRONTEND_ORIGINS is required");
 for (const origin of allowedOrigins) {
  const url = new URL(origin);
  if (url.origin !== origin || (production && url.protocol !== "https:")) throw new Error("FRONTEND_ORIGINS must contain exact HTTPS origins without trailing slash");
 }
 if (emailAuthEnabled()) validateMailEnvironment();
 const hops = Number(process.env.TRUST_PROXY_HOPS || "0");
 if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error("TRUST_PROXY_HOPS must be between 0 and 5");
}
