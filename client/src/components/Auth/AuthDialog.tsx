import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Brand } from "../Landing/Landing";
import { useAuthStore } from "../../store/authStore";
import "./AuthDialog.css";
export function AuthDialog({mode}:{mode:"login"|"register"}){
 const ref=useRef<HTMLDialogElement>(null);
 const navigate=useNavigate();
 const clearError=useAuthStore(s=>s.clearError);
 const busy=useAuthStore(s=>s.isLoading);
 useEffect(()=>{clearError();},[mode,clearError]);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const dialog=ref.current;dialog?.showModal();
  const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{dialog?.close();document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 const close=()=>{if(!busy)navigate("/");};
 return <dialog ref={ref} className="auth-dialog" aria-label={mode==="login"?"Вход в FIT Track":"Регистрация в FIT Track"} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}}}>
 <button type="button" className="auth-close" aria-label="Закрыть" disabled={busy} onClick={close}>×</button><Brand/>
 <div className="auth-tabs"><button disabled={busy} aria-pressed={mode==="login"} onClick={()=>navigate("/login",{replace:true})}>Вход</button><button disabled={busy} aria-pressed={mode==="register"} onClick={()=>navigate("/register",{replace:true})}>Регистрация</button></div>
 {mode==="login"?<LoginForm/>:<RegisterForm/>}<p className="auth-footnote">Твой дневник. Твой темп. Твой прогресс.</p>
 </dialog>
}
