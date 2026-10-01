import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { WorkoutForm } from "../WorkoutForm/WorkoutForm";
import { useWorkoutStore } from "../../store/workoutStore";
import { useModalClose } from "../../utils/useModalClose";
import styles from "./MainPages.module.css";

export function ExerciseModal({ workoutId, onClose, onAdded }: { workoutId: string; onClose: () => void; onAdded: () => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const { selectedDate, isSaving, error } = useWorkoutStore();
 const animateClose = useModalClose(dialog);
 const close = () => { if (!isSaving) animateClose(onClose); };
 useEffect(() => {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const element = dialog.current;
  element?.showModal();
  const overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
 }, []);
 return createPortal(<dialog ref={dialog} className={styles.exerciseModal} aria-label="Добавить упражнение"
  onCancel={event => { event.preventDefault(); close(); }}
  onClick={event => { if (event.target !== event.currentTarget || isSaving) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); }}>
  <div className={styles.modalToolbar}><span>{selectedDate.toLocaleDateString("ru-RU", {day:"numeric",month:"long",year:"numeric"})}</span><button type="button" aria-label="Закрыть" disabled={isSaving} onClick={close}>×</button></div>
  {error && <p role="alert">{error}</p>}
  <WorkoutForm workoutId={workoutId} onAdded={() => animateClose(onAdded)} />
 </dialog>, document.body);
}
