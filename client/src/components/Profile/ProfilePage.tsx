import { ThemeToggle } from "../ThemeToggle";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { Brand, Footer } from "../Landing/Landing";
import { WeightCard } from "./WeightCard";
import { CategoryManager } from "./CategoryManager";
import "./Profile.css";
export function ProfilePage() {
 const {user, logout, isLoading, error} = useAuthStore();
 const { hash } = useLocation();
 useEffect(() => {
  if (hash === "#categories") document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
 }, [hash]);
 return <div className="profile-page"><header className="shell profile-header"><Link to="/"><Brand/></Link><nav><ThemeToggle/><Link to="/diary">К дневнику</Link><button disabled={isLoading} onClick={() => void logout()}>Выйти</button></nav></header><main className="shell profile-main"><div className="profile-heading"><div className="eyebrow">Личное пространство</div><h1>{user?.name || "Мой профиль"}</h1><p>{user?.email}</p></div>{error && <p role="alert">{error}</p>}<div className="profile-grid"><WeightCard/><CategoryManager/></div></main><Footer/></div>;
}
