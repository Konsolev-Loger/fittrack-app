import { ThemeToggle } from "../ThemeToggle";
import { Link } from "react-router";
import { Brand, Footer } from "../Landing/Landing";
import "./Profile.css";
export function DownloadPage() {
 return <div className="profile-page"><header className="shell profile-header"><Link to="/"><Brand/></Link><nav><ThemeToggle/><Link to="/">На главную</Link></nav></header><main className="shell download-main"><div className="eyebrow">Setly в твоём телефоне</div><h1>Дневник всегда рядом.</h1><p>Готовим приложение, чтобы записывать тренировки было ещё удобнее. А пока дневник доступен в браузере.</p><div className="download-options">{["iOS", "Android"].map(platform => <section className="download-option" key={platform}><svg viewBox="0 0 32 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="2" width="22" height="36" rx="5"/><path d="M12 6h8M13 33h6"/></svg><h2>{platform}</h2><button disabled>Скачать для {platform}</button></section>)}</div><p className="download-status">В разработке</p></main><Footer/></div>;
}
