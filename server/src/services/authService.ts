import { requestAccountMail } from "./emailTokenService";
import { emailAuthEnabled } from "../configs/features";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import generateToken from "../tokens/generateToken";
import { verifyRefreshTokenUtil } from "../tokens/tokenUtils";
import { SESSION_DURATION } from "../tokens/jwtConfig";
import type { RegisterRequest } from "../types/auth";
class AuthService {
 async register(data: RegisterRequest) {
  if (!emailAuthEnabled()) {
   if (await prisma.user.findUnique({ where: { email: data.email } })) throw new HttpError(409, "Этот email уже зарегистрирован. Войди в аккаунт.");
   const password = await bcrypt.hash(data.password, 10);
   return prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: { ...data, password }, select: { id: true, email: true, name: true } });
    const session = await tx.session.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + SESSION_DURATION) } });
    return { user, ...generateToken(user.id, session.id), expiresAt: session.expiresAt };
   });
  }
  const password = await bcrypt.hash(data.password, 10);
  await prisma.user.upsert({ where: { email: data.email }, update: {}, create: { ...data, password } });
  await requestAccountMail(data.email, "verify");
 }
 async login(email: string, password: string) {
  return prisma.$transaction(async tx => {
   const found = await tx.user.findUnique({ where: { email }, select: { id: true } });
   if (!found) throw new HttpError(401, "Неверный email или пароль");
   // Serialize with password reset; no stale-password login may create a session afterwards.
   await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${found.id} FOR UPDATE`;
   const user = await tx.user.findUniqueOrThrow({ where: { id: found.id } });
   if (!await bcrypt.compare(password, user.password)) throw new HttpError(401, "Неверный email или пароль");
   if (emailAuthEnabled() && !user.emailVerifiedAt) throw new HttpError(403, "Подтверди email перед входом. Если письмо не пришло, запроси его повторно.");
   const safeUser = { id: user.id, email: user.email, name: user.name };
   const session = await tx.session.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + SESSION_DURATION) } });
   return { user: safeUser, ...generateToken(user.id, session.id), expiresAt: session.expiresAt };
  });
 }
 async refreshTokens(token: string) {
  const decoded = verifyRefreshTokenUtil(token);
  if (!decoded) throw new HttpError(401, "Сессия завершена");
  const session = await prisma.session.findFirst({ where: { id: decoded.sessionId, userId: decoded.userId, expiresAt: { gt: new Date() } },
   include: { user: { select: { id: true, email: true, name: true } } } });
  if (!session) throw new HttpError(401, "Сессия завершена");
  // Session expiry is fixed; refresh never extends a revoked or expired session.
  return { accessToken: generateToken(session.userId, session.id).accessToken, user: session.user };
 }
 async logout(token: string | undefined) {
  const decoded = token ? verifyRefreshTokenUtil(token) : null;
  if (decoded) await prisma.session.deleteMany({ where: { id: decoded.sessionId, userId: decoded.userId } });
 }
}
export const authService = new AuthService();
