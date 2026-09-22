import { Router } from "express";
import authController from "../controllers/authController";
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../validation/auth.validation";
import { authLimiter } from "../middlewares/security";
import { emailSchema, tokenSchema, resetPasswordSchema } from "../validation/auth.validation";
import { emailLimiter } from "../middlewares/security";
import { requestAccountMail, consumeAccountToken, mailRequestMessage } from "../services/emailTokenService";
import formatResponse from "../utils/formatResponse";
import { emailAuthEnabled } from "../configs/features";
const router = Router();
router.use((req, res, next) => {
 if (!emailAuthEnabled() && ["/resend-verification", "/forgot-password", "/verify-email", "/reset-password"].includes(req.path)) {
  res.status(404).json(formatResponse(404, "Почтовые функции пока недоступны"));
  return;
 }
 next();
});
router.post("/resend-verification", emailLimiter, validate(emailSchema), async (req, res) => {
 await requestAccountMail(req.body.email, "verify");
 res.json(formatResponse(200, mailRequestMessage));
});
router.post("/forgot-password", emailLimiter, validate(emailSchema), async (req, res) => {
 await requestAccountMail(req.body.email, "reset");
 res.json(formatResponse(200, mailRequestMessage));
});
router.post("/verify-email", authLimiter, validate(tokenSchema), async (req, res) => {
 await consumeAccountToken(req.body.token, "verify");
 res.json(formatResponse(200, "Email подтверждён. Теперь можно войти."));
});
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res) => {
 await consumeAccountToken(req.body.token, "reset", req.body.password);
 res.json(formatResponse(200, "Пароль изменён. Войди с новым паролем."));
});
router.post("/register", emailLimiter, authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
export default router;
