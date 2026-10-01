import { ThemeToggle } from "../ThemeToggle";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import "./Landing.css";
import "./Sequence.css";
import { DemoDiary } from "./DemoDiary";
import { useScrollReveal } from "./useScrollReveal";
export function Brand() {
	return (
		<span className="brand">
			<svg className="brand-symbol" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <g fill="var(--accent)"><path d="M24 2 31 6 11 18 14 20 34 8 44 14 44 23 24 35 17 31 37 19 34 17 14 29 4 23 4 14Z"/><path d="M4 27 24 39 44 27 44 35 24 47 4 35Z"/></g>
            </svg>
			Setly
		</span>
	);
}
function Arrow({ direction = "diagonal" }: { direction?: "diagonal" | "up" | "down" }) {
 return <svg className="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction === "up" ? "M12 19V5m-6 6 6-6 6 6" : direction === "down" ? "M12 5v14m-6-6 6 6 6-6" : "M6 18 18 6M6 6h12v12"}/></svg>;
}
export function Footer({ showDownload = true }: { showDownload?: boolean }) {
	return (
		<footer className="site-footer" data-compact={!showDownload}>
			<div className="shell footer-inner">
				<div className="footer-brand">
					<Link to="/" aria-label="Setly — главная">
						<Brand />
					</Link>
					<span>Дневник твоих тренировок.</span>
                        <a className="footer-contact" href="https://t.me/Leopard_Lvovich" target="_blank" rel="noopener noreferrer">По всем вопросам — @Leopard_Lvovich</a>
				</div>
				{showDownload && <Link className="footer-download primary" to="/download">
					Скачать приложение <Arrow direction="down" />
				</Link>}
				<span className="footer-copyright">© {new Date().getFullYear()} Setly</span>
			</div>
		</footer>
	);
}
const benefits = [
	[
		"01",
		"Тренировки по дням",
		"Вся история — в календаре. Открой нужный день, чтобы продолжить тренировку или вернуться к прошлым результатам.",
		"calendar",
	],
	[
		"02",
		"Каждый подход на месте",
		"Записывай вес и повторения сразу после подхода. Меньше держать в голове — больше внимания тренировке.",
		"sets",
	],
	[
		"03",
		"Твой набор упражнений",
		"Создавай тренировки, добавляй упражнения, кардио и заметки. Дневник подстраивается под твою программу.",
		"exercise",
	],
	[
		"04",
		"Прогресс в деталях",
		"Сравнивай записи прошлых тренировок. Замечай даже небольшие изменения и двигайся дальше в своём темпе.",
		"progress",
	],
];
function FeatureIcon({ type }: { type: string }) {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
			{type === "calendar" ? (
				<>
					<rect x="4" y="5" width="16" height="15" rx="3" />
					<path d="M8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2" />
				</>
			) : type === "sets" ? (
				<>
					<path d="M10 6h10M10 12h10M10 18h10m-16-12 1 1 2-3m-3 8 1 1 2-3m-3 8 1 1 2-3" />
				</>
			) : type === "exercise" ? (
				<>
					<path d="M3 9v6m4-9v12m10-12v12m4-9v6M7 12h10" />
				</>
			) : (
				<>
					<path d="M4 4v16h16M8 15l4-5 4 2 4-7" />
				</>
			)}
		</svg>
	);
}
function SectionTransition({
	number,
	label,
	target,
	children,
}: {
	number: string;
	label: string;
	target: string;
	children: React.ReactNode;
}) {
	return (
		<div className="shell section-divider" data-reveal>
			<span>
				{number} / {label}
			</span>
			<a href={target}>
				{children} <Arrow direction="down" />
			</a>
		</div>
	);
}
export function Landing() {
	const revealRoot = useScrollReveal();
	const authenticated = useAuthStore((s) => s.isAuthenticated);
	const target = authenticated ? "/diary" : "/register";
	return (
		<div className="landing-sequence" ref={revealRoot}>
			<header className="landing-header shell">
				<Link to="/" aria-label="Setly — главная">
					<Brand />
				</Link>
				<nav aria-label="Основная навигация"><ThemeToggle/>
					<a className="about-link" href="#demo">
						Демонстрация
					</a>
					<a className="about-link" href="#features">
						Возможности
					</a>
					{!authenticated && <Link className="desktop-login" to="/login">Войти</Link>}
					<Link className="header-cta" to={target} state={{ tryDiary: !authenticated }}>
						{authenticated ? "К дневнику" : "Попробовать"} <Arrow />
					</Link>
				</nav>
			</header>
			<main>
				<section id="intro" className="intro-screen">
					<div className="hero shell">
						<div className="hero-copy">
							<div className="eyebrow">Меньше шума. Больше движения.</div>
							<h1>
								Твой прогресс
								<br />
								начинается с <span>записи.</span>
							</h1>
							<div className="hero-lower">
								<p>
									Тренировки, подходы и личные результаты.
									<br />
									Всё в одном дневнике — в твоём темпе.
								</p>
							</div>
						</div>
					</div>
					<SectionTransition number="01" label="ТВОЙ ДНЕВНИК" target="#demo">
						Попробуй в движении
					</SectionTransition>
				</section>
				<section id="demo" className="demo-screen">
					<div className="shell demo-content">
						<div className="demo-intro" data-reveal>
							<div>
								<div className="eyebrow">Почувствуй, как это работает</div>
								<h2>
									Одна неделя.
									<br />
									<span>Твой ритм.</span>
								</h2>
							</div>
							<p>
								Переключай дни, записывай вес и добавляй подходы.
								<br />
								Это пример: изменения исчезнут после обновления страницы
								<br />и не попадут в личный дневник.
							</p>
						</div>
						<div data-reveal><DemoDiary /></div>
					</div>
					<SectionTransition number="02" label="ВОЗМОЖНОСТИ" target="#features">
						Всё начинается с простого
					</SectionTransition>
				</section>
				<section id="features" className="features-screen">
					<div className="features shell">
						<div className="feature-intro" data-reveal>
							<h2>
								Всё нужное.
								<br />
								<span>Ничего лишнего.</span>
							</h2>
							<p>
								Простой инструмент для постоянства.
								<br />
								От первого подхода до новой личной планки.
							</p>
						</div>
						<div className="feature-grid">
							{benefits.map(([number, title, description, type]) => (
								<article className="feature-card" key={number} data-reveal>
									<div className="feature-card-top">
										<FeatureIcon type={type} />
										<span>{number}</span>
									</div>
									<h3>{title}</h3>
									<p>{description}</p>
								</article>
							))}
						</div>
						<div className="closing" data-reveal>
							<div>
								<div className="eyebrow">Следующий шаг — твой</div>
								<h2>Начни с одной тренировки.</h2>
							</div>

						</div>
					</div>
					<div className="shell section-divider last-divider">
						<a href="#intro">
							К началу <Arrow direction="up" />
						</a>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
