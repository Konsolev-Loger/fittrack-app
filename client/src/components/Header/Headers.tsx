import { ThemeToggle } from "../ThemeToggle";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { Brand } from "../Landing/Landing";
import styles from "./Headers.module.css";
export const Header = () => {
 const {user,logout,isLoading,error}=useAuthStore();
 return <header className={styles.header}><div className={styles.inner}><Link to="/" aria-label="FIT Track — главная"><Brand/></Link><span className={styles.section}>Личный дневник</span><div className={styles.userBlock}><ThemeToggle/><Link to="/profile" title={user?.name || "Мой профиль"}>Профиль</Link><button type="button" disabled={isLoading} onClick={()=>void logout()}>Выйти</button></div></div>{error&&<p role="alert" className="shell">{error}</p>}</header>;
};
