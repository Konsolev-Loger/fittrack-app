import { useEffect, useRef, useState } from "react";

type DemoSet = { weight: string; reps: string };
type DemoExercise = { name: string; group: string; sets: DemoSet[] };
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const titles = ["Грудь и спина", "Лёгкая тренировка", "Силовая тренировка", "Плечи и руки", "Ноги и корпус", "Тренировка выходного дня", "Восстановительная тренировка"];
function createWeek(): DemoExercise[][] {
 return weekdays.map((_, day) => (day % 2 === 0
  ? [["Жим лёжа", "Грудь", 60], ["Приседания", "Ноги", 80], ["Тяга верхнего блока", "Спина", 45]]
  : [["Жим гантелей", "Плечи", 16], ["Сгибание рук", "Руки", 12], ["Тяга горизонтального блока", "Спина", 35]]
 ).map(([name, group, weight]) => ({
  name: String(name), group: String(group),
  sets: Array.from({ length: 3 }, (_, index) => ({ weight: String(Number(weight) + (day === 4 ? 5 : 0)), reps: String(12 - index * 2) })),
 })));
}

const demoName = "Жим гантелей лёжа";
const demoNote = "Плавно опускаю вес, без рывков.";
const typeText = (text: string, time: number, start: number, speed = 100) => text.slice(0, Math.max(0, Math.floor((time - start) / speed)));
function demoFrame(time: number) {
 const week = createWeek();
 const name = typeText(demoName, time, 2800);
 const note = typeText(demoNote, time, 4800);
 const modal = time >= 2100 && time < 8800;
 week[0] = time < 8800 ? [] : [{name:demoName,group:"Грудь",sets:[
  {weight:typeText("20",time,9500,250),reps:typeText("12",time,10600,250)},
  ...(time >= 13400 ? [{weight:typeText("22",time,14000,250),reps:typeText("10",time,15000,250)}] : []),
 ]}];
 const message = time < 1100 ? "Выбираем день тренировки." : time < 2100 ? "Нажимаем «Добавить упражнение»." : time < 4800 ? "Вводим название своего упражнения." : time < 7800 ? "Добавляем заметку к тренировке." : time < 8800 ? "Сохраняем упражнение." : time < 12400 ? "Записываем вес и повторения." : time < 13400 ? "Добавляем следующий подход." : "Два подхода записаны. Теперь попробуй сам.";
 return {week,day:0,message,modal,name,note};
}

export function DemoDiary() {
 const [manualDay, setDay] = useState(2);
 const [manualWeek, setWeek] = useState(createWeek);
 const [manualMessage, setMessage] = useState("");
 const root = useRef<HTMLDivElement>(null);
 const [automatic, setAutomatic] = useState(() => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 const [visible, setVisible] = useState(false);
 const [pageVisible, setPageVisible] = useState(true);
 const [time, setTime] = useState(0);
 const [manualModal, setManualModal] = useState(false);
 const [exerciseName, setExerciseName] = useState("");
 const [exerciseNote, setExerciseNote] = useState("");
 useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
  if (root.current) observer.observe(root.current);
  const onVisibility = () => setPageVisible(!document.hidden);
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotion = () => { if (media.matches) setAutomatic(false); };
  document.addEventListener("visibilitychange", onVisibility);
  media.addEventListener("change", onMotion);
  onVisibility();
  return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); media.removeEventListener("change", onMotion); };
 }, []);
 useEffect(() => {
  if (!automatic || !visible || !pageVisible) return;
  const timer = window.setInterval(() => setTime(value => (value + 100) % 20000), 100);
  return () => window.clearInterval(timer);
 }, [automatic, visible, pageVisible]);
 const frame = demoFrame(time);
 const day = automatic ? frame.day : manualDay;
 const week = automatic ? frame.week : manualWeek;
 const message = automatic ? frame.message : manualMessage;
 const takeControl = () => {
  if (!automatic) return;
  if (frame.modal) { setManualModal(true); setExerciseName(frame.name); setExerciseNote(frame.note); }
  setDay(day); setWeek(week); setMessage("Теперь твоя очередь — попробуй изменить тренировку."); setAutomatic(false);
 };
 const handleInteraction = (event: React.SyntheticEvent) => {
  if (event.target instanceof Element && event.target.closest("button, input, textarea, select") && !event.target.closest("[data-demo-replay]")) takeControl();
 };
 const clickWave = (start: number) => automatic && time >= start && time < start + 900 ? <span className="demo-click-wave" aria-hidden="true" /> : null;
 const updateSet = (exercise: number, set: number, field: keyof DemoSet, value: string) => {
  if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > (field === "weight" ? 1000 : 100) || (field === "reps" && !Number.isInteger(Number(value))))) return;
  setWeek(previous => previous.map((exercises, d) => d !== day ? exercises : exercises.map((item, e) => e !== exercise ? item : {
   ...item, sets: item.sets.map((itemSet, s) => s !== set ? itemSet : { ...itemSet, [field]: value }),
  })));
  setMessage(value === "" ? "" : "Изменения сохранены в примере.");
 };
 const addSet = (exercise: number) => {
  setWeek(previous => previous.map((exercises, d) => d !== day ? exercises : exercises.map((item, e) => e !== exercise ? item : {
   ...item, sets: [...item.sets, { weight: "0", reps: "10" }],
  })));
  setMessage("Новый подход добавлен.");
 };
 const removeSet = (exercise: number, set: number) => {
  setWeek(previous => previous.map((exercises, d) => d !== day ? exercises : exercises.map((item, e) => e !== exercise ? item : {
   ...item, sets: item.sets.filter((_, index) => index !== set),
  })));
  setMessage("Подход удалён из примера.");
 };
 return <div ref={root} className={`demo-diary ${automatic ? "demo-playing" : ""}`} onPointerDownCapture={handleInteraction} onFocusCapture={handleInteraction}>
  <div className="demo-top"><div><span className="eyebrow">Сентябрь 2026</span><h3>Твоя неделя в движении.</h3></div><span className="sample-label">{automatic ? "Автопоказ" : "Попробуй сам"}</span></div>
  <div className="demo-week" role="group" aria-label="Дни демонстрационной недели">
   {weekdays.map((name, index) => <button key={name} type="button" aria-pressed={day === index} aria-label={name + ", " + (14 + index) + " сентября"} className={day === index ? "demo-day selected" : "demo-day"} onClick={() => { setDay(index); setMessage(""); }}><span>{name}</span><b>{14 + index}</b><i aria-hidden="true"/>{index === 0 && clickWave(0)}</button>)}
  </div>
  <div className="demo-session"><h3>{titles[day]}</h3><span>{14 + day} сентября · Упражнений: {week[day].length}</span></div>
  <div className="demo-create-bar"><button type="button" className="demo-create" onClick={() => { setExerciseName(""); setExerciseNote(""); setManualModal(true); }}>+ Добавить упражнение{clickWave(1100)}</button></div>
  <div className="demo-stage">
  {(automatic ? frame.modal : manualModal) && <div className="demo-modal-shade">
   <form className="demo-form-modal" aria-label="Демонстрация добавления упражнения" onSubmit={event => {
    event.preventDefault();
    if (automatic || exerciseName.trim().length < 2) return;
    setWeek(previous => previous.map((items,index) => index !== day ? items : [...items,{name:exerciseName.trim(),group:"Грудь",sets:[{weight:"0",reps:"10"}]}]));
    setManualModal(false); setMessage("Упражнение добавлено в пример.");
   }}>
    <div className="demo-form-heading"><span>Демонстрационный пример · {14 + day} сентября</span><button type="button" aria-label="Закрыть пример формы" onClick={() => setManualModal(false)}>×</button></div>
    <h4>Добавить упражнение</h4>
    <label>Группа мышц<select value="Грудь" disabled><option>Грудь</option></select></label>
    <label>Название упражнения<input required minLength={2} maxLength={150} placeholder="Например, жим гантелей лёжа" value={automatic ? frame.name : exerciseName} onChange={event => setExerciseName(event.target.value)} className={automatic && time >= 2800 && time < 4800 ? "demo-typing" : ""}/></label>
    <label>Заметка<textarea maxLength={2000} placeholder="На что обратить внимание" value={automatic ? frame.note : exerciseNote} onChange={event => setExerciseNote(event.target.value)} className={automatic && time >= 4800 && time < 7800 ? "demo-typing" : ""}/></label>
    <div className="demo-form-count">Количество подходов <b>1</b></div>
    <button type="submit" className="primary demo-save">Записать в текущий день{clickWave(7900)}</button>
   </form>
  </div>}
  <div className="demo-exercises">
   {week[day].length === 0 && <div className="demo-placeholder">Новый день. Начнём с первого упражнения.</div>}
   {week[day].map((exercise, e) => <article className="demo-exercise" key={day + "-" + e}>
    <div className="demo-exercise-name"><span className="exercise-index">0{e + 1}</span><div><h4>{exercise.name}</h4><p>{exercise.group}</p></div></div>
    <div className="demo-sets">{exercise.sets.map((set, s) => <fieldset className="demo-set" key={s}><legend>Подход {s + 1}</legend>
     <button type="button" className="demo-remove" aria-label={exercise.name + ", удалить подход " + (s + 1)} onClick={() => removeSet(e, s)} title="Удалить подход">×</button>
     <label><span>Вес, кг</span><input type="number" min="0" max="1000" step="0.5" aria-label={exercise.name + ", подход " + (s + 1) + ", вес"} data-highlight={automatic && e === 0 && ((time >= 9500 && time < 10600 && s === 0) || (time >= 14000 && time < 15000 && s === 1))} value={set.weight} onChange={event => updateSet(e, s, "weight", event.target.value)} onBlur={() => { if (set.weight === "") updateSet(e, s, "weight", "0"); }}/></label>
     <span className="demo-times" aria-hidden="true">×</span>
     <label><span>Повторы</span><input type="number" min="0" max="100" step="1" aria-label={exercise.name + ", подход " + (s + 1) + ", повторения"} data-highlight={automatic && e === 0 && ((time >= 10600 && time < 11800 && s === 0) || (time >= 15000 && time < 16000 && s === 1))} value={set.reps} onChange={event => updateSet(e, s, "reps", event.target.value)} onBlur={() => { if (set.reps === "") updateSet(e, s, "reps", "0"); }}/></label>
    </fieldset>)}
    <button type="button" className="demo-add" disabled={exercise.sets.length >= 8} aria-label={"Добавить подход: " + exercise.name} onClick={() => addSet(e)}>+ Подход{e === 0 && clickWave(12400)}</button></div>
   </article>)}
  </div>
  </div>
  <div className="demo-bottom"><span aria-live={automatic ? "off" : "polite"}>{message || "Выбери день и попробуй изменить вес или повторения."}</span><div className="demo-play-controls"><button type="button" onClick={takeControl}>{automatic ? "Попробовать самому" : "Ручной режим"}</button><button type="button" data-demo-replay onClick={() => { setTime(0); setManualModal(false); setAutomatic(true); }}>Повторить показ ↻</button></div></div>
 </div>;
}
