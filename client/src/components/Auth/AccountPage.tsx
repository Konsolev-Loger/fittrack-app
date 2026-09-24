import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Brand } from "../Landing/Landing";
import { axiosInstance } from "../../api/axiosInstance";
import { getErrorMessage } from "../../utils/errors";
import { useAuthStore } from "../../store/authStore";
import "./AccountPage.css";

type Mode = "verify-email" | "reset-password" | "forgot-password" | "check-email";
export function AccountPage({ mode }: { mode: Mode }) {
 const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
 const location = useLocation();
 const [email, setEmail] = useState(typeof location.state?.email === "string" ? location.state.email : "");
 const [password, setPassword] = useState("");
 const [confirmation, setConfirmation] = useState("");
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState("");
 const [error, setError] = useState("");
 const [complete, setComplete] = useState(false);
 const [cooldown, setCooldown] = useState(false);
 useEffect(() => {
  if (!cooldown) return;
  const timer = window.setTimeout(() => setCooldown(false), 60_000);
  return () => window.clearTimeout(timer);
 }, [cooldown]);
 const requestMail = mode === "forgot-password" || mode === "check-email";
 const validToken = /^[a-f0-9]{64}$/.test(token);
 const title = { "verify-email": "Подтверди свой email.", "reset-password": "Новый пароль.", "forgot-password": "Вернём доступ.", "check-email": "Проверь почту." }[mode];
 const submit = async (event: React.FormEvent) => {
  event.preventDefault(); setError(""); setMessage("");
  if (mode === "reset-password" && (password !== confirmation || password.length < 8 || password.length > 35 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || new TextEncoder().encode(password).length > 72)) {
   setError(password !== confirmation ? "Пароли не совпадают." : "Используй 8–35 символов: заглавную и строчную латинские буквы, цифру и спецсимвол."); return;
  }
  setBusy(true);
  try {
   const endpoint = mode === "check-email" ? "resend-verification" : mode;
   const response = await axiosInstance.post(`/auth/${endpoint}`, requestMail ? { email: email.trim().toLowerCase() } : { token, ...(mode === "reset-password" ? { password } : {}) });
   setMessage(response.data.message);
   if (requestMail) { setCooldown(true); }
   else { setComplete(true); window.history.replaceState(null, "", window.location.pathname); }
   if (mode === "reset-password") { useAuthStore.getState().resetAuth(); setPassword(""); setConfirmation(""); }
  } catch (e) { setError(getErrorMessage(e)); }
  finally { setBusy(false); }
 };
 return <main className="account-page"><Link to="/" aria-label="Setly — главная"><Brand/></Link>
  <section className="account-card"><span className="eyebrow">Твой дневник рядом</span><h1>{title}</h1>
   <p className="muted">{mode === "check-email" ? "Открой письмо от Setly и подтверди адрес. Если письма нет, проверь «Спам» или запроси его ещё раз." : mode === "forgot-password" ? "Укажи email своего аккаунта. Мы отправим ссылку для смены пароля." : mode === "verify-email" ? "Нажми кнопку ниже, чтобы завершить подтверждение и перейти ко входу." : "После смены пароля потребуется заново войти на всех устройствах."}</p>
   {!requestMail && !validToken && !complete ? <p role="alert">В ссылке нет действительного кода. Запроси новое письмо.</p> : !complete && <form onSubmit={submit}>
    {requestMail && <label>Email<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>}
    {mode === "reset-password" && <><label>Новый пароль<input required type="password" autoComplete="new-password" minLength={8} maxLength={35} value={password} onChange={e => setPassword(e.target.value)}/></label><p className="account-hint muted">8–35 символов: заглавная и строчная латинские буквы, цифра и спецсимвол.</p><label>Повтори пароль<input required type="password" autoComplete="new-password" maxLength={35} value={confirmation} onChange={e => setConfirmation(e.target.value)}/></label></>}
    <button className="primary" disabled={busy || cooldown}>{busy ? "Подожди…" : cooldown ? "Повторить можно через минуту" : mode === "verify-email" ? "Подтвердить email" : mode === "reset-password" ? "Сохранить пароль" : "Отправить письмо"}</button>
   </form>}
   {error && <p role="alert">{error}</p>}{message && <p role="status" className="account-success">{message}</p>}
   <div className="account-links"><Link to="/login">Вернуться ко входу →</Link>{!requestMail && !complete && <Link to={mode === "verify-email" ? "/check-email" : "/forgot-password"}>Запросить новую ссылку</Link>}</div>
  </section></main>;
}
