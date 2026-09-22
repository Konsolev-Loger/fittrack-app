import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import styles from "./RegisterForm.module.css";

const registerSchema = z.object({
	name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").max(50, "Имя слишком длинное").trim(),

	email: z.string().trim().min(1, "Email обязателен").email("Некорректный формат email").toLowerCase().trim(),

	password: z
		.string()
		.min(8, "Пароль должен содержать минимум 8 символов")
		.max(35, "Пароль слишком длинный")
		.regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
		.regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
		.regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру")
 .regex(/[^A-Za-z0-9]/, "Пароль должен содержать спецсимвол").refine(value => new TextEncoder().encode(value).length <= 72, "Пароль должен занимать не более 72 байт"),
});
type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
	const navigate = useNavigate();
	const { register: registerUser, error, clearError, isLoading } = useAuthStore();

	const {
		register: registerField,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		mode: "onChange",
	});

	const onSubmit = async (data: RegisterFormData) => {
		clearError();

		try {
			await registerUser(data);
			
			reset();
			navigate(useAuthStore.getState().isAuthenticated ? "/diary" : "/check-email", { state: { email: data.email } });
		} catch {
            // The store provides a safe user-facing error; never log credentials.
		}
	};

	return (
		<div className={styles.registerContainer}>
			<div className={styles.mainCountainer}>
				<form onSubmit={handleSubmit(onSubmit)} className={styles.registerForm}>
					<h2>Твоя первая запись.</h2>

					<div className={styles.inputGroup}>
						<label htmlFor="register-name">Как тебя зовут?</label>
						<input id="register-name"
							aria-label="Имя" autoComplete="name" type="text"
							placeholder="Ваше имя"
							{...registerField("name")}
							onInput={clearError}
							className={errors.name ? styles.inputError : ""}
						/>
						{errors.name && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipIcon}>!</span>
								<span className={styles.tooltipText}>{errors.name.message}</span>
							</div>
						)}
					</div>

					<div className={styles.inputGroup}>
						<label htmlFor="register-email">Email</label>
						<input
							id="register-email" aria-label="Email" autoComplete="email" type="email"
							placeholder="Email"
							{...registerField("email")}
							onInput={clearError}
							className={errors.email ? styles.inputError : ""}
						/>
						{errors.email && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipIcon}>!</span>
								<span className={styles.tooltipText}>{errors.email.message}</span>
							</div>
						)}
					</div>

					<div className={styles.inputGroup}>
						<label htmlFor="register-password">Пароль</label>
						<input
							id="register-password" aria-label="Пароль" autoComplete="new-password" type="password"
							placeholder="Пароль"
							{...registerField("password")}
							onInput={clearError}
							className={errors.password ? styles.inputError : ""}
						/>
						<p style={{fontSize:11, color:"var(--muted)", marginTop:8}}>8–35 символов: заглавная и строчная латинские буквы, цифра и спецсимвол.</p>
						{errors.password && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipIcon}>!</span>
								<span className={styles.tooltipText}>{errors.password.message}</span>
							</div>
						)}
					</div>

					{/* Ошибка из сервера / стора */}
					{error && <div role="alert" className={styles.storeError}>{error}</div>}

					<button type="submit" disabled={isLoading} className={styles.button}>
						{isLoading ? "Регистрация..." : "Зарегистрироваться"}
					</button>

					<div className={styles.loginLink}>
						<span>Уже есть аккаунт?</span>
						<button type="button" disabled={isLoading} onClick={() => navigate("/login", { replace: true })} className={styles.linkButton}>
							Войти
						</button>
					</div>
				</form>

			</div>
		</div>
	);
};
