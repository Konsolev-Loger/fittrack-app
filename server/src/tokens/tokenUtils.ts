import jwt from "jsonwebtoken";
import type { TokenPayload } from "../types/auth";
function verify(token: string, kind: "access" | "refresh"): TokenPayload | null {
 const secret = kind === "access" ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;
 if (!secret || typeof token !== "string") return null;
 try {
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  if (typeof payload === "string" || payload.kind !== kind || typeof payload.userId !== "string" || typeof payload.sessionId !== "string") return null;
  return payload as TokenPayload;
 } catch { return null; }
}
export const verifyAccessTokenUtil = (token: string) => verify(token, "access");
export const verifyRefreshTokenUtil = (token: string) => verify(token, "refresh");
