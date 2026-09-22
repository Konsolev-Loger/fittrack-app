import type { Request, Response } from "express";
import { authService } from "../services/authService";
import { refreshCookieOptions } from "../tokens/jwtConfig";
import formatResponse from "../utils/formatResponse";
class AuthController {
 async register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  if (result) {
   const { user, accessToken, refreshToken, expiresAt } = result;
   res.clearCookie("refreshToken", { path: "/" });
   res.status(201).cookie("refreshToken", refreshToken, { ...refreshCookieOptions, expires: expiresAt })
    .json(formatResponse(201, "Аккаунт создан", { user, accessToken }));
   return;
  }
  res.status(201).json(formatResponse(201, "Проверь почту для подтверждения email. Если аккаунт уже существует, войди или восстанови пароль."));
 }
 async login(req: Request, res: Response) {
  const { user, accessToken, refreshToken, expiresAt } = await authService.login(req.body.email, req.body.password);
  res.clearCookie("refreshToken", { path: "/" });
  res.cookie("refreshToken", refreshToken, { ...refreshCookieOptions, expires: expiresAt })
   .json(formatResponse(200, "Успешный вход", { user, accessToken }));
 }
 async refresh(req: Request, res: Response) {
  try { res.json(formatResponse(200, "Сессия обновлена", await authService.refreshTokens(req.cookies.refreshToken))); }
  catch (error) {
   // Temporary server failures must not destroy a valid refresh cookie.
   if (error instanceof Error && "status" in error && error.status === 401) res.clearCookie("refreshToken", refreshCookieOptions);
   throw error;
  }
 }
 async logout(req: Request, res: Response) {
  await authService.logout(req.cookies.refreshToken);
  res.clearCookie("refreshToken", refreshCookieOptions).clearCookie("refreshToken", { path: "/" })
   .json(formatResponse(200, "Выход выполнен"));
 }
}
export default new AuthController();
