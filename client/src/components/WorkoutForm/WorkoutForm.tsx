import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { useWorkoutStore, type ExerciseFormData } from "../../store/workoutStore";
import styles from "./WorkoutFrom.module.css";
export const WorkoutForm = ({ onAdded }: { onAdded?: () => void }) => {
 const { categories, addCategory, addExercise, isSaving } = useWorkoutStore();
 const [newCatName, setNewCatName] = useState("");
 const [showCatInput, setShowCatInput] = useState(false);
 const [addingCategory, setAddingCategory] = useState(false);
 const { register, handleSubmit, reset } = useForm<ExerciseFormData>({ defaultValues: {setsCount: 3, isCompound: false, isFailure: false, isDropSet: false} });
 const onAddCategory = async () => {
  if (!newCatName.trim() || addingCategory) return;
  setAddingCategory(true);
  try { if (await addCategory(newCatName.trim())) { setNewCatName(""); setShowCatInput(false); } }
  finally { setAddingCategory(false); }
 };
 const onSubmit = async (data: ExerciseFormData) => { if (await addExercise(data)) { reset(); onAdded?.(); } };
 return <div className={styles.formBlock}>
  <h3>Добавить упражнение</h3>
  <Link className="category-shortcut" to="/profile#categories">Управление своими категориями ↗</Link>
  <div className={styles.catManager}>
   <button type="button" onClick={() => setShowCatInput(!showCatInput)}>{showCatInput ? "Закрыть" : "+ Своя категория"}</button>
   {showCatInput && <div className={styles.inlineInput}>
    <input aria-label="Название группы мышц" type="text" minLength={2} maxLength={30} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Группа мышц..." />
    <button type="button" disabled={addingCategory || newCatName.trim().length < 2} onClick={() => void onAddCategory()}>Создать</button>
   </div>}
  </div>
  <form onSubmit={handleSubmit(onSubmit)} className={styles.mainForm}>
   <label className={styles.fieldLabel}>Группа мышц<select disabled={isSaving} aria-label="Группа мышц" {...register("categoryId")} required>
    <option value="">-- Выберите группу мышц --</option>
    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
   </select></label>
   <label className={styles.fieldLabel}>Название упражнения<input disabled={isSaving} aria-label="Название упражнения" type="text" {...register("name")} minLength={2} maxLength={150} placeholder="Например, жим лёжа" required /></label>
   <label className={styles.fieldLabel}>Заметка <span className={styles.optional}>необязательно</span><textarea disabled={isSaving} aria-label="Описание упражнения" {...register("description")} maxLength={2000} placeholder="Техника, ощущения или рабочие подсказки" /></label>
   <label className={styles.fieldLabel}>Количество подходов<input disabled={isSaving} type="number" aria-label="Количество подходов" {...register("setsCount", { valueAsNumber: true })} min={1} max={100} step={1} placeholder="Количество подходов" required className={styles.fullWidthInput} /></label>
   <div className={styles.checkboxes}>
    <label><input disabled={isSaving} type="checkbox" {...register("isCompound")} /> Многосуставное</label>
    <label><input disabled={isSaving} type="checkbox" {...register("isFailure")} /> Отказной подход</label>
    <label><input disabled={isSaving} type="checkbox" {...register("isDropSet")} /> Дроп-сет</label>
   </div>
   <button type="submit" disabled={isSaving} className={styles.submitBtn}>{isSaving ? "Сохранение…" : "Записать в текущий день"}</button>
  </form>
 </div>;
};
