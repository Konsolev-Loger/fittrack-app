import jwt from "jsonwebtoken";
import { jwtConfig } from "./jwtConfig";
export default function generateToken(userId: string, sessionId: string) {
 return {
  accessToken: jwt.sign({ userId, sessionId, kind: "access" }, process.env.ACCESS_TOKEN_SECRET!, jwtConfig.access),
  refreshToken: jwt.sign({ userId, sessionId, kind: "refresh" }, process.env.REFRESH_TOKEN_SECRET!, jwtConfig.refresh),
 };
}
