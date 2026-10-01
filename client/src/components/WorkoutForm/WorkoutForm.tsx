import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useWorkoutStore, type ExerciseFormData } from "../../store/workoutStore";
import styles from "./WorkoutFrom.module.css";
export const WorkoutForm = ({ workoutId, onAdded }: { workoutId: string; onAdded?: () => void }) => {
 const [timed, setTimed] = useState(false);
 const [expanded, setExpanded] = useState(false);
 const extraId = useId();
 const { addExercise, isSaving } = useWorkoutStore();
 const { register, handleSubmit, reset } = useForm<ExerciseFormData>({ defaultValues: {durationMinutes: 60, setsCount: 3, isCompound: false, isFailure: false, isDropSet: false} });
 const onSubmit = async (data: ExerciseFormData) => { if (await addExercise({...data, workoutId, distanceKm: timed && Number.isFinite(data.distanceKm) ? data.distanceKm : undefined, durationMinutes: timed ? data.durationMinutes : undefined, isCompound: !timed && data.isCompound, isFailure: !timed && data.isFailure, isDropSet: !timed && data.isDropSet})) { onAdded?.(); if (!onAdded) reset(); } };
 return <div className={styles.formBlock}>
  <h3>Добавить упражнение</h3>
  <div className={styles.modeSwitch} role="group" aria-label="Способ записи"><button type="button" disabled={isSaving} aria-pressed={!timed} onClick={() => setTimed(false)}>Подходы</button><button type="button" disabled={isSaving} aria-pressed={timed} onClick={() => setTimed(true)}>Кардио</button></div>
  <form onSubmit={handleSubmit(onSubmit)} className={styles.mainForm}>
   <label className={styles.fieldLabel}>Название упражнения<input autoFocus disabled={isSaving} aria-label="Название упражнения" type="text" {...register("name")} minLength={2} maxLength={150} placeholder={timed ? "Например, бег или теннис" : "Например, жим лёжа"} required /></label>
   {timed && <div className={styles.cardioFields}><label className={styles.fieldLabel}><span>Длительность, мин</span><input required disabled={isSaving} type="number" inputMode="numeric" min={1} max={1440} step={1} {...register("durationMinutes", {valueAsNumber:true})} /></label><label className={styles.fieldLabel}><span>Расстояние, км</span><input disabled={isSaving} type="number" inputMode="decimal" min={0} max={1000} step="any" placeholder="Например, 5" {...register("distanceKm",{valueAsNumber:true})} /></label></div>}
   <div className={styles.additional}>
   <button type="button" className={styles.extraToggle} aria-expanded={expanded} aria-controls={extraId} onClick={() => setExpanded(value => !value)}>Дополнительно <svg className={styles.extraArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></button>
   <div id={extraId} className={styles.extraPanel} data-expanded={expanded} inert={!expanded} aria-hidden={!expanded}><div className={styles.extraContent}>
   <label className={styles.fieldLabel}>Заметка<textarea disabled={isSaving} aria-label="Описание упражнения" {...register("description")} maxLength={2000} placeholder="Техника, ощущения или рабочие подсказки" /></label>
   </div></div></div>
   <button type="submit" disabled={isSaving} className={styles.submitBtn}>{isSaving ? "Сохранение…" : "Добавить"}</button>
  </form>
 </div>;
};
