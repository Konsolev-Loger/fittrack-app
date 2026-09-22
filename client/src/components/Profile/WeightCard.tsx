import { useEffect, useState, type FormEvent } from "react";
import { axiosInstance } from "../../api/axiosInstance";
import { getErrorMessage } from "../../utils/errors";
type Goal = { startWeight: number; currentWeight: number; targetWeight: number; updatedAt: string };
export function WeightCard() {
 const [goal, setGoal] = useState<Goal | null>(null);
 const [current, setCurrent] = useState("");
 const [target, setTarget] = useState("");
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const [message, setMessage] = useState("");
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  let active = true;
  axiosInstance.get<{data: Goal | null}>("/profile/weight").then(({data}) => {
   if (!active) return;
   setGoal(data.data); setCurrent(data.data ? String(data.data.currentWeight) : ""); setTarget(data.data ? String(data.data.targetWeight) : ""); setError("");
  }).catch(error => { if (active) setError(getErrorMessage(error)); }).finally(() => { if (active) setLoading(false); });
  return () => { active = false; };
 }, [retry]);
 const save = async (event: FormEvent) => {
  event.preventDefault(); setSaving(true); setError(""); setMessage("");
  try {
   const {data} = await axiosInstance.put<{data: Goal}>("/profile/weight", {currentWeight: Number(current), targetWeight: Number(target)});
   setGoal(data.data); setMessage("Вес и цель сохранены.");
  } catch (error) { setError(getErrorMessage(error)); }
  finally { setSaving(false); }
 };
 const distance = goal ? goal.targetWeight - goal.startWeight : 0;
 const reached = goal && (distance === 0 ? goal.currentWeight === goal.targetWeight : distance > 0 ? goal.currentWeight >= goal.targetWeight : goal.currentWeight <= goal.targetWeight);
 const progress = goal ? distance === 0 ? reached ? 100 : 0 : Math.max(0, Math.min(100, (goal.currentWeight - goal.startWeight) / distance * 100)) : 0;
 return <section className="profile-card weight-card"><div className="eyebrow">Твоя цель</div><h2>Вес и прогресс</h2><p className="muted">Обновляй вес, когда удобно. Последнее значение всегда будет здесь.</p>
  {loading ? <p role="status">Загрузка…</p> : <>
   {goal ? <div className="weight-overview"><div className="weight-numbers"><div><span>Сейчас</span><strong>{goal.currentWeight}<small> кг</small></strong></div><div><span>Цель</span><strong>{goal.targetWeight}<small> кг</small></strong></div></div>
    <div className="weight-progress" role="progressbar" aria-label="Прогресс к цели по весу" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{width: progress + "%"}}/></div>
    <div className="weight-caption"><span>Старт: {goal.startWeight} кг</span><span>{reached ? "Цель достигнута" : "До цели: " + Number(Math.abs(goal.targetWeight - goal.currentWeight).toFixed(2)) + " кг"}</span></div><p className="form-note">Обновлено {new Date(goal.updatedAt).toLocaleDateString("ru-RU")}</p>
   </div> : <p className="weight-empty">Укажи текущий вес и желаемую цель — здесь появится твоя шкала прогресса.</p>}
   <form onSubmit={save}><div className="weight-fields"><label>Текущий вес, кг<input required disabled={saving} type="number" min="0.1" max="1000" step="0.1" value={current} onChange={event => setCurrent(event.target.value)}/></label><label>Цель, кг<input required disabled={saving} type="number" min="0.1" max="1000" step="0.1" value={target} onChange={event => setTarget(event.target.value)}/></label></div><p className="form-note">При смене цели отсчёт начнётся с указанного текущего веса.</p><button className="primary" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить вес и цель"}</button></form>
  </>}
  {error && <div role="alert">{error} <button type="button" disabled={saving} onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Повторить загрузку</button></div>}
  {message && <p role="status" className="profile-success">{message}</p>}
 </section>;
}
