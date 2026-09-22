import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { sendAccountMail } from "./mailService";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const mailRequestMessage = "Если адрес подходит для этого действия, письмо отправлено. Проверь почту и папку «Спам». Повторить запрос можно через минуту.";

export async function requestAccountMail(email: string, purpose: "verify" | "reset") {
 const user = await prisma.user.findUnique({ where: { email } });
 if (!user || (purpose === "verify" && user.emailVerifiedAt)) return;
 const token = randomBytes(32).toString("hex");
 const record = await prisma.$transaction(async tx => {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
  const latest = await tx.emailToken.findFirst({ where: { userId: user.id, purpose }, orderBy: { createdAt: "desc" } });
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) return null;
  await tx.emailToken.deleteMany({ where: { userId: user.id, purpose, expiresAt: { lt: new Date() } } });
  return tx.emailToken.create({ data: { userId: user.id, purpose, tokenHash: hash(token), expiresAt: new Date(Date.now() + (purpose === "verify" ? 86400_000 : 1800_000)) } });
 });
 if (!record) return;
 try { await sendAccountMail(email, purpose, token); }
 catch {
  await prisma.emailToken.deleteMany({ where: { id: record.id } });
  // Identical HTTP response avoids revealing whether an account exists.
  console.error("Account email delivery failed; check mail configuration.");
 }
}

export async function consumeAccountToken(token: string, purpose: "verify" | "reset", password?: string) {
 const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
 await prisma.$transaction(async tx => {
  const record = await tx.emailToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!record || record.purpose !== purpose) throw new HttpError(400, "Ссылка недействительна или истекла. Запроси новое письмо.");
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${record.userId} FOR UPDATE`;
  const consumed = await tx.emailToken.deleteMany({ where: { id: record.id, expiresAt: { gt: new Date() } } });
  if (!consumed.count) throw new HttpError(400, "Ссылка недействительна или истекла. Запроси новое письмо.");
  await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date(), ...(purpose === "reset" ? { password: passwordHash } : {}) } });
  await tx.emailToken.deleteMany({ where: { userId: record.userId, ...(purpose === "verify" ? { purpose } : {}) } });
  if (purpose === "reset") await tx.session.deleteMany({ where: { userId: record.userId } });
 });
}
