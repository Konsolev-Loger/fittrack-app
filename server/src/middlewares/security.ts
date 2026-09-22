import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { allowedOrigins } from "../configs/environment";
import { HttpError } from "../utils/httpError";

// CORS alone does not reject state-changing requests from a foreign website.
export const protectBrowserWrites: RequestHandler = (req, _res, next) => {
 if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
 const origin = req.get("origin");
 if (origin && !allowedOrigins.includes(origin)) throw new HttpError(403, "Источник запроса не разрешён");
 if (req.get("sec-fetch-site") === "cross-site" && !origin) throw new HttpError(403, "Источник запроса не разрешён");
 if ((Number(req.get("content-length") || 0) > 0 || req.get("transfer-encoding")) && !req.is("application/json")) throw new HttpError(415, "Используйте application/json");
 next();
};

export const authLimiter = rateLimit({
 windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false,
 skipSuccessfulRequests: true,
 message: {statusCode:429,message:"Слишком много попыток. Попробуйте через 15 минут.",data:null},
});
export const apiLimiter = rateLimit({
 windowMs: 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false,
 message: {statusCode:429,message:"Слишком много запросов. Подождите минуту.",data:null},
});
export const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { statusCode: 429, message: "Слишком много запросов писем. Попробуй через 15 минут.", data: null } });
