import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Brand } from "../Landing/Landing";
import { useAuthStore } from "../../store/authStore";
import { useModalClose } from "../../utils/useModalClose";
import "./AuthDialog.css";
export function AuthDialog({mode}:{mode:"login"|"register"}){
 const ref=useRef<HTMLDialogElement>(null);
 const navigate=useNavigate();
 const location=useLocation();
 const animateClose=useModalClose(ref);
 const authenticated=useAuthStore(s=>s.isAuthenticated);
 const clearError=useAuthStore(s=>s.clearError);
 const busy=useAuthStore(s=>s.isLoading);
 useEffect(()=>{clearError();},[mode,clearError]);
 useEffect(()=>{if(authenticated) animateClose(()=>navigate("/diary",{replace:true}));},[authenticated,animateClose,navigate]);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const dialog=ref.current;dialog?.showModal();
  const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{dialog?.close();document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 const close=()=>{if(!busy)animateClose(()=>navigate("/"));};
 return <dialog ref={ref} className="auth-dialog" aria-label={mode==="login"?"Вход в Setly":"Регистрация в Setly"} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}}}>
 <button type="button" className="auth-close" aria-label="Закрыть" disabled={busy} onClick={close}>×</button><Brand/>
 {location.state?.tryDiary && <p className="auth-explanation">Чтобы попробовать личный дневник и сохранять тренировки, зарегистрируйся или войди.</p>}
 <div className="auth-forms">
  <div className="auth-panel" data-active={mode==="login"} inert={mode!=="login"} aria-hidden={mode!=="login"}><div className="auth-panel-content"><LoginForm/></div></div>
  <div className="auth-panel" data-active={mode==="register"} inert={mode!=="register"} aria-hidden={mode!=="register"}><div className="auth-panel-content"><RegisterForm onCheckEmail={email=>animateClose(()=>navigate("/check-email",{state:{email}}))}/></div></div>
 </div>
 <p className="auth-switch">{mode==="login"?"Нет аккаунта? ":"Уже есть аккаунт? "}<button type="button" disabled={busy} onClick={()=>navigate(mode==="login"?"/register":"/login",{replace:true,state:location.state})}>{mode==="login"?"Зарегистрироваться":"Войти"}</button></p>
 </dialog>
}
