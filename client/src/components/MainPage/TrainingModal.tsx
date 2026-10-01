import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWorkoutStore } from "../../store/workoutStore";
import { useModalClose } from "../../utils/useModalClose";
import styles from "./MainPages.module.css";

export function TrainingModal({onClose}:{onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [name,setName]=useState("");
 const {addWorkout,isSaving,error}=useWorkoutStore();
 const animateClose=useModalClose(dialog);
 const close=()=>{if(!isSaving)animateClose(onClose);};
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const element=dialog.current;
  const overflow=document.body.style.overflow;
  element?.showModal();document.body.style.overflow="hidden";
  return()=>{element?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
 },[]);
 return createPortal(<dialog ref={dialog} className={styles.exerciseModal} aria-labelledby="training-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{
  if(event.target!==event.currentTarget)return;
  const rect=event.currentTarget.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();
 }}>
  <div className={styles.modalToolbar}><h2 id="training-title">Добавить тренировку</h2><button type="button" aria-label="Закрыть" disabled={isSaving} onClick={close}>×</button></div>
  <form className={styles.trainingForm} onSubmit={async event=>{event.preventDefault();if(await addWorkout(name.trim()))animateClose(onClose);}}>
   <label>Название тренировки<input autoFocus required minLength={2} maxLength={100} disabled={isSaving} value={name} placeholder="Например, грудь или утренний бег" onChange={event=>setName(event.target.value)}/></label>
   {error&&<p role="alert">{error}</p>}
   <button className="primary" disabled={isSaving || name.trim().length<2}>{isSaving?"Добавляем…":"Добавить"}</button>
  </form>
 </dialog>,document.body);
}
