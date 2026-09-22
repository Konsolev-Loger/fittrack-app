import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import { emailAuthEnabled } from "../../emailFeature";
import styles from "./LoginForm.module.css";

const loginSchema = z.object({
	email: z.string().trim().min(1, "Email обязателен").email("Введите корректный email").toLowerCase().trim(),

	password: z
		.string()
		.min(1, "Пароль обязателен")
		.min(6, "Пароль должен содержать минимум 6 символов")
		.max(35, "Пароль слишком длинный"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
	const navigate = useNavigate();
	const { login, error, clearError, isLoading } = useAuthStore();
	const {
		register: registerField,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: "onChange",
	});
	const onSubmit = async (data: LoginFormData) => {
		clearError();
		try {
			await login(data);
			reset(); // Очищаем форму только в случае успешного входа
			navigate("/diary");
		} catch {
            // The store provides a safe user-facing error; never log credentials.
		}
	};
	return (
		<div className={styles.loginContainer}>
			<div className={styles.mainCountainer}>
				<form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm}>
					<h2>С возвращением.</h2>

					{/* ===== Email ===== */}
					<div className={styles.inputGroup}>
						<label htmlFor="login-email">Email</label>
						<input id="login-email"
							aria-label="Email" autoComplete="email" type="email"
							placeholder="Email"
							{...registerField("email")}
							onInput={clearError} // добавлено
							className={errors.email ? styles.inputError : ""}
						/>
						{errors.email && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipIcon}>!</span>
								<span className={styles.tooltipText}>{errors.email.message}</span>
							</div>
						)}
					</div>

					{/* ===== Password ===== */}
					<div className={styles.inputGroup}>
						<label htmlFor="login-password">Пароль</label>
						<input
							id="login-password" aria-label="Пароль" autoComplete="current-password" type="password"
							placeholder="Пароль"
							{...registerField("password")}
							onInput={clearError} // добавлено
							className={errors.password ? styles.inputError : ""}
						/>
						{errors.password && (
							<div className={styles.tooltip}>
								<span className={styles.tooltipIcon}>!</span>
								<span className={styles.tooltipText}>{errors.password.message}</span>
							</div>
						)}
					</div>

					{emailAuthEnabled && <div className={styles.loginLink}><button type="button" className={styles.linkButton} onClick={() => navigate("/forgot-password")}>Забыли пароль?</button><button type="button" className={styles.linkButton} onClick={() => navigate("/check-email")}>Подтвердить email</button></div>}
                    {/* Ошибка из стора */}
					{error && <div role="alert" className={styles.storeError}>{error}</div>}

					<button type="submit" disabled={isLoading} className={styles.button}>
						{isLoading ? "Вход..." : "Войти"}
					</button>

					<div className={styles.loginLink}>
						<span>Нет аккаунта?</span>
						<button type="button" disabled={isLoading} onClick={() => navigate("/register", { replace: true })} className={styles.linkButton}>
							Зарегистрироваться
						</button>
					</div>
				</form>

			</div>
		</div>
	);
};
