// Button.tsx
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger";
	isLoading?: boolean;
}

export default function Button({
	children,
	variant = "primary",
	isLoading = false,
	disabled,
	className,
	...props
}: ButtonProps) {
	return (
		<button
			className={`${styles.button} ${styles[variant]} ${className || ""}`}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? "Загрузка..." : children}
		</button>
	);
}
