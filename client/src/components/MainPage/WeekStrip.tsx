import { useEffect, useState } from "react";
import { axiosInstance } from "../../api/axiosInstance";
import { useWorkoutStore } from "../../store/workoutStore";
import { dateKey } from "../../utils/dates";
import styles from "./MainPages.module.css";

export function WeekStrip() {
 const { selectedDate, setSelectedDate, isSaving, monthlyWorkouts } = useWorkoutStore();
 const monday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
 monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
 const days = Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
 const weekKey = dateKey(monday);
 const workoutDays = monthlyWorkouts.filter(day => day.exercises.length > 0).map(day => day.date).join(",");
const [marked, setMarked] = useState<{week: string; dates: string[]}>({week:"",dates:[]});
const [markerError, setMarkerError] = useState(false);
useEffect(() => {
 let active = true;
 const start = new Date(weekKey + "T12:00:00");
 const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
 const months = start.getMonth() === end.getMonth() ? [start] : [start, end];
 Promise.all(months.map(date => axiosInstance.get<{data: {date: string; exercises: unknown[]}[]}>("/workout/calendar", {params:{month:date.getMonth()+1,year:date.getFullYear()}})))
  .then(results => { if (active) { setMarked({week:weekKey,dates:results.flatMap(result => result.data.data.filter(day => day.exercises.length > 0).map(day => day.date))}); setMarkerError(false); } })
  .catch(() => { if (active) setMarkerError(true); });
 return () => { active = false; };
}, [weekKey, workoutDays]);
const hasWorkout = (day: Date) => marked.week === weekKey && marked.dates.includes(dateKey(day));
const today = dateKey(new Date());
 const move = (offset: number) => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + offset));
 return <section className={styles.weekStrip} aria-label="Выбор дня тренировки">
  <div className={styles.weekToolbar}><span>Твоя неделя</span><div><button type="button" disabled={isSaving} aria-label="Предыдущая неделя" onClick={() => move(-7)}>←</button><button type="button" disabled={isSaving} onClick={() => setSelectedDate(new Date())}>Сегодня</button><button type="button" disabled={isSaving} aria-label="Следующая неделя" onClick={() => move(7)}>→</button></div></div>
  <div className={styles.weekDays}>{days.map(day => <button type="button" key={dateKey(day)} disabled={isSaving} data-workout={hasWorkout(day)} aria-pressed={dateKey(day) === dateKey(selectedDate)} aria-current={dateKey(day) === today ? "date" : undefined} aria-label={day.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + (hasWorkout(day) ? ", есть тренировка" : "")} onClick={() => setSelectedDate(day)}><span>{day.toLocaleDateString("ru-RU", {weekday:"short"})}</span><strong>{day.getDate()}</strong><i aria-hidden="true" /></button>)}</div>
 {markerError && <small role="status">Не удалось загрузить отметки тренировок.</small>}
 </section>;
}
