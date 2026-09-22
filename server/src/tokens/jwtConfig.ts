import "dotenv/config";
import type { CookieOptions } from "express";
import type { SignOptions } from "jsonwebtoken";
export const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000;
export const jwtConfig: { access: SignOptions; refresh: SignOptions } = {
 access: { expiresIn: "15m", algorithm: "HS256" }, refresh: { expiresIn: "3d", algorithm: "HS256" },
};
export const refreshCookieOptions: CookieOptions = {
 httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/auth",
};
