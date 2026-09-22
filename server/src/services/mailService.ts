import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const mailMode = () => process.env.MAIL_MODE || (process.env.NODE_ENV === "production" ? "smtp" : "preview");
export function validateMailEnvironment() {
 const origin = process.env.APP_URL || "http://127.0.0.1:5173";
 const url = new URL(origin);
 if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) throw new Error("APP_URL must be an exact HTTP(S) origin");
 if (!["smtp", "preview"].includes(mailMode())) throw new Error("MAIL_MODE must be smtp or preview");
 if (process.env.NODE_ENV === "production" && (mailMode() !== "smtp" || !process.env.APP_URL || url.protocol !== "https:")) throw new Error("Production requires SMTP and an HTTPS APP_URL");
 if (mailMode() === "smtp") {
  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"]) if (!process.env[key]) throw new Error(key + " is required");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid SMTP_PORT");
 }
}

export async function sendAccountMail(email: string, purpose: "verify" | "reset", token: string) {
 const url = new URL(purpose === "verify" ? "/verify-email" : "/reset-password", process.env.APP_URL || "http://127.0.0.1:5173");
 // Fragment tokens do not reach web server access logs or Referer headers.
 url.hash = new URLSearchParams({ token }).toString();
 const subject = purpose === "verify" ? "Подтверди email — FIT Track" : "Восстановление пароля — FIT Track";
 const text = `${subject}\n\n${purpose === "verify" ? "Подтверди адрес почты, чтобы открыть дневник. Ссылка действует 24 часа." : "Задай новый пароль. Ссылка действует 30 минут."}\n\n${url.toString()}\n\nЕсли ты не отправлял запрос, просто проигнорируй это письмо.\nFIT Track`;
 if (mailMode() === "preview") {
  if (process.env.NODE_ENV === "production") throw new Error("Mail preview is disabled in production");
  const directory = process.env.MAIL_PREVIEW_DIR || path.resolve(".mail-preview");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path.join(directory, `${Date.now()}-${randomUUID()}.json`), JSON.stringify({ to: email, subject, text }, null, 2), { mode: 0o600 });
  return;
 }
 const port = Number(process.env.SMTP_PORT || 587);
 const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000,
  disableFileAccess: true, disableUrlAccess: true });
 await transport.sendMail({ from: process.env.MAIL_FROM, to: { address: email, name: "" }, subject, text });
}
