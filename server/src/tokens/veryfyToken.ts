import type { RequestHandler } from "express";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { verifyAccessTokenUtil } from "./tokenUtils";
export const verifyAccessToken: RequestHandler = async (req, res, next) => {
 const [type, token] = req.headers.authorization?.split(" ") ?? [];
 const decoded = type === "Bearer" && token ? verifyAccessTokenUtil(token) : null;
 if (!decoded) throw new HttpError(401, "Необходим вход в аккаунт");
 const session = await prisma.session.findFirst({ where: { id: decoded.sessionId, userId: decoded.userId, expiresAt: { gt: new Date() } } });
 if (!session) throw new HttpError(401, "Сессия завершена");
 res.locals.userId = decoded.userId;
 next();
};
