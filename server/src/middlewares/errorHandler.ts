import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { HttpError } from "../utils/httpError";
import formatResponse from "../utils/formatResponse";
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
 if (res.headersSent) return next(error);
 if (error instanceof ZodError) {
  res.status(400).json(formatResponse(400, "Ошибка валидации", null,
   error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })))); return;
 }
 if (error instanceof HttpError) { res.status(error.status).json(formatResponse(error.status, error.message)); return; }
 if (error instanceof Prisma.PrismaClientKnownRequestError) {
  const status = error.code === "P2025" ? 404 : ["P2002", "P2003"].includes(error.code) ? 409 : 500;
  res.status(status).json(formatResponse(status, status === 404 ? "Запись не найдена" : status === 409 ? "Конфликт данных" : "Ошибка сервера")); return;
 }
 const status = typeof error === "object" && error !== null && "status" in error &&
  typeof error.status === "number" && [400, 413].includes(error.status) ? error.status : 500;
 if (status === 500) console.error("Unhandled server error", {name: error instanceof Error ? error.name : "UnknownError"});
 res.status(status).json(formatResponse(status, status === 500 ? "Ошибка сервера" : "Некорректный запрос"));
};
