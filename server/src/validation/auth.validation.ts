import { z } from "zod";

export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Имя должно содержать минимум 2 символа")
		.max(50, "Имя слишком длинное")
		.trim()
		.optional(),

	email: z.string().trim().max(254).email("Некорректный формат email").toLowerCase().trim(),

	password: z
		.string()
		.min(8, "Пароль должен содержать минимум 8 символов")
		.max(35, "Пароль слишком длинный")
		.regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
		.regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
		.regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру")
		.regex(/[^A-Za-z0-9]/, "Пароль должен содержать спецсимвол")
        .refine(value => Buffer.byteLength(value, "utf8") <= 72, "Пароль должен занимать не более 72 байт"),
});

export const loginSchema = z.object({
	email: z.string().trim().max(254).email("Некорректный email").toLowerCase().trim(),
	password: z.string().min(6, "Пароль должен содержать минимум 6 символов").max(256),
});

export const emailSchema = z.object({
	email: z.string().trim().max(254).email("Некорректный email").toLowerCase().trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, "Некорректная ссылка") });
export const resetPasswordSchema = tokenSchema.extend({ password: registerSchema.shape.password });
