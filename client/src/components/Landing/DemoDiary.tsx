import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useModalClose } from "../../utils/useModalClose";
import formStyles from "../WorkoutForm/WorkoutFrom.module.css";
import modalStyles from "../MainPage/MainPages.module.css";

type DemoSet={weight:string;reps:string};
type Exercise={id:string;name:string;note:string;sets:DemoSet[];minutes?:string;km?:string};
type Training={id:string;name:string;exercises:Exercise[]};
type Week=Training[][];
const days=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const emptyWeek=():Week=>days.map(()=>[]);
const threeSets=():DemoSet[]=>Array.from({length:3},()=>({weight:"0",reps:"0"}));
const id=()=>crypto.randomUUID();
function frame(time:number) {
 const week=emptyWeek();
 if(time>=4800)week[0]=[{id:"demo-training",name:"Грудь",exercises:time>=10500?[{id:"demo-exercise",name:"Жим лёжа",note:"",sets:threeSets().map((set,index)=>time>=12000+index*1200?{weight:String(40+index*5),reps:String(12-index*2)}:set)}]:[]}];
 const phase=time>=1400&&time<4800?"training":time>=6500&&time<10500?"exercise":null;
 const displayPhase=time<6000?"training":"exercise";
 const name=displayPhase==="training"?"Грудь".slice(0,Math.max(0,Math.floor((time-2000)/220))):"Жим лёжа".slice(0,Math.max(0,Math.floor((time-7100)/200)));
 const message=time<4800?"Сначала создаём тренировку и называем её.":time<10500?"Нажимаем «+» и добавляем упражнение.":"Записываем вес и повторения в трёх подходах.";
 return {week,phase,displayPhase,name,message};
}
function Plus(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>;}
function DemoEditor({kind,onClose,onSave}:{kind:"training"|"exercise";onClose:()=>void;onSave:(name:string,exercise?:Exercise)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const close=useModalClose(dialog);
 const [name,setName]=useState("");const [note,setNote]=useState("");const [cardio,setCardio]=useState(false);const [minutes,setMinutes]=useState("60");const [km,setKm]=useState("");const [expanded,setExpanded]=useState(false);
 useEffect(()=>{const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;const element=dialog.current;const overflow=document.body.style.overflow;element?.showModal();document.body.style.overflow="hidden";return()=>{element?.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};},[]);
 const title=kind==="training"?"Добавить тренировку":"Добавить упражнение";
 return createPortal(<dialog ref={dialog} className={modalStyles.exerciseModal} aria-label={title} onCancel={e=>{e.preventDefault();close(onClose);}} onClick={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(onClose);}}>
  <div className={modalStyles.modalToolbar}><span>Демонстрация</span><button type="button" aria-label="Закрыть" onClick={()=>close(onClose)}>×</button></div><h3>{title}</h3>
  {kind==="exercise"&&<div className={formStyles.modeSwitch}><button type="button" aria-pressed={!cardio} onClick={()=>setCardio(false)}>Подходы</button><button type="button" aria-pressed={cardio} onClick={()=>setCardio(true)}>Кардио</button></div>}
  <form className={formStyles.mainForm} onSubmit={e=>{e.preventDefault();if(name.trim().length<2)return;close(()=>onSave(name.trim(),kind==="exercise"?{id:id(),name:name.trim(),note,sets:cardio?[]:threeSets(),...(cardio?{minutes,km}: {})}:undefined));}}>
   <label className={formStyles.fieldLabel}>{kind==="training"?"Название тренировки":"Название упражнения"}<input autoFocus required minLength={2} maxLength={kind==="training"?100:150} value={name} onChange={e=>setName(e.target.value)} placeholder={kind==="training"?"Например, грудь":cardio?"Например, бег":"Например, жим лёжа"}/></label>
   {kind==="exercise"&&cardio&&<div className={formStyles.cardioFields}><label className={formStyles.fieldLabel}><span>Длительность, мин</span><input required type="number" min={1} max={1440} step={1} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label><label className={formStyles.fieldLabel}><span>Расстояние, км</span><input type="number" min={0} max={1000} step="any" value={km} onChange={e=>setKm(e.target.value)}/></label></div>}
   {kind==="exercise"&&<div className={formStyles.additional}><button type="button" className={formStyles.extraToggle} aria-expanded={expanded} aria-controls="demo-extra-note" onClick={()=>setExpanded(v=>!v)}>Дополнительно<svg className={formStyles.extraArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div id="demo-extra-note" className={formStyles.extraPanel} data-expanded={expanded} inert={!expanded} aria-hidden={!expanded}><div className={formStyles.extraContent}><label className={formStyles.fieldLabel}>Заметка<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label></div></div></div>}
   <button className={formStyles.submitBtn}>Добавить</button>
  </form>
 </dialog>,document.body);
}
export function DemoDiary() {
 const root=useRef<HTMLDivElement>(null);
 const [automatic,setAutomatic]=useState(()=>!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 const [time,setTime]=useState(0);const [visible,setVisible]=useState(false);const [pageVisible,setPageVisible]=useState(true);
 const [manualWeek,setWeek]=useState<Week>(emptyWeek);const [manualDay,setDay]=useState(0);
 const [editor,setEditor]=useState<{kind:"training"|"exercise";trainingId?:string}|null>(null);
 const [collapsed,setCollapsed]=useState<string[]>([]);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.1});if(root.current)observer.observe(root.current);const visibility=()=>setPageVisible(!document.hidden);document.addEventListener("visibilitychange",visibility);const media=window.matchMedia("(prefers-reduced-motion: reduce)");const motion=()=>{if(media.matches)setAutomatic(false);};media.addEventListener("change",motion);return()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);media.removeEventListener("change",motion);};},[]);
 useEffect(()=>{if(!automatic||!visible||!pageVisible)return;const timer=setInterval(()=>setTime(v=>(v+100)%19000),100);return()=>clearInterval(timer);},[automatic,visible,pageVisible]);
 const current=frame(time),week=automatic?current.week:manualWeek,day=automatic?0:manualDay;
 const takeControl=()=>{if(automatic){setWeek(current.week);setDay(0);setAutomatic(false);}};
 const updateExercise=(trainingId:string,exerciseId:string,update:(ex:Exercise)=>Exercise)=>setWeek(prev=>prev.map((list,d)=>d!==day?list:list.map(t=>t.id!==trainingId?t:{...t,exercises:t.exercises.map(ex=>ex.id===exerciseId?update(ex):ex)})));
 const updateSet=(trainingId:string,exerciseId:string,index:number,field:keyof DemoSet,value:string)=>{
  if(value!==""&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>10000||(field==="reps"&&!Number.isInteger(Number(value)))))return;
  updateExercise(trainingId,exerciseId,ex=>({...ex,sets:ex.sets.map((set,i)=>i===index?{...set,[field]:value}:set)}));
 };
 return <div ref={root} className="demo-diary" onPointerDownCapture={event=>{if(event.target instanceof Element&&event.target.closest("button,input")&&!event.target.closest("[data-demo-replay]"))takeControl();}} onFocusCapture={event=>{if(event.target instanceof Element&&!event.target.closest("[data-demo-replay]"))takeControl();}}>
  <div className="demo-top"><div><span className="eyebrow">Демонстрационный дневник</span><h3>Тренировка начинается с названия.</h3></div><span className="sample-label">{automatic?"Автопоказ":"Попробуй сам"}</span></div>
  <div className="demo-week" role="group" aria-label="Дни демонстрационной недели">{days.map((name,i)=><button type="button" key={name} className={day===i?"demo-day selected":"demo-day"} aria-pressed={day===i} onClick={()=>setDay(i)}><span>{name}</span><b>{14+i}</b></button>)}</div>
  <div className="demo-create-bar"><button type="button" className="demo-create" onClick={()=>setEditor({kind:"training"})}>+ Добавить тренировку</button></div>
  <div className="demo-stage">
   <div className="demo-exercises">
    {!week[day].length&&<p className="demo-placeholder">Добавь тренировку, например «Грудь».</p>}
    {week[day].map(training=><section key={training.id} className="demo-training"><header><h3>{training.name}</h3><button className="demo-training-add" type="button" aria-label={`Добавить упражнение в тренировку ${training.name}`} onClick={()=>setEditor({kind:"exercise",trainingId:training.id})}><Plus/></button></header>
     {!training.exercises.length&&<p className="demo-placeholder">Нажми «+», чтобы добавить упражнение.</p>}
     {training.exercises.map(ex=><article key={ex.id} className="demo-exercise"><div className="demo-exercise-name"><h4>{ex.name}</h4><button type="button" className="demo-collapse" aria-label={`${collapsed.includes(ex.id)?"Показать":"Скрыть"} запись: ${ex.name}`} aria-expanded={!collapsed.includes(ex.id)} onClick={()=>setCollapsed(items=>items.includes(ex.id)?items.filter(x=>x!==ex.id):[...items,ex.id])}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
      <div className="demo-record" data-collapsed={collapsed.includes(ex.id)} inert={collapsed.includes(ex.id)} aria-hidden={collapsed.includes(ex.id)}><div className="demo-record-content">
       {ex.minutes!==undefined?<div className="demo-cardio"><label>Длительность, мин<input aria-label={`Длительность: ${ex.name}`} type="number" min={1} max={1440} value={ex.minutes} onChange={e=>updateExercise(training.id,ex.id,item=>({...item,minutes:e.target.value}))}/></label><label>Расстояние, км<input aria-label={`Расстояние: ${ex.name}`} type="number" min={0} max={1000} step="any" value={ex.km||""} onChange={e=>updateExercise(training.id,ex.id,item=>({...item,km:e.target.value}))}/></label></div>:<div className="demo-sets">{ex.sets.map((set,i)=><fieldset className="demo-set" key={i}><legend>Подход {i+1}</legend><button type="button" className="demo-remove" aria-label={`Удалить подход ${i+1}: ${ex.name}`} onClick={()=>updateExercise(training.id,ex.id,item=>({...item,sets:item.sets.filter((_,n)=>n!==i)}))}>×</button>{(["weight","reps"] as const).map(field=><label key={field}><span>{field==="weight"?"Вес, кг":"Повторы"}</span><input type="number" min={0} max={10000} step={field==="weight"?"any":1} aria-label={`${ex.name}, подход ${i+1}, ${field==="weight"?"вес":"повторения"}`} value={set[field]} onFocus={e=>{if(set[field]==="0")updateSet(training.id,ex.id,i,field,"");else e.target.select();}} onChange={e=>updateSet(training.id,ex.id,i,field,e.target.value)} onBlur={()=>{if(set[field]==="")updateSet(training.id,ex.id,i,field,"0");}}/></label>)}</fieldset>)}<button type="button" className="demo-add" disabled={ex.sets.length>=100} onClick={()=>updateExercise(training.id,ex.id,item=>({...item,sets:[...item.sets,{weight:"0",reps:"0"}]}))}>+ Добавить подход</button></div>}
       {ex.note&&<p className="demo-note">{ex.note}</p>}
      </div></div>
     </article>)}
    </section>)}
   </div>
   <div className="demo-auto-preview" data-open={automatic&&current.phase!==null} aria-hidden="true" inert><div className="demo-form-modal"><h4>{current.displayPhase==="training"?"Добавить тренировку":"Добавить упражнение"}</h4><label>{current.displayPhase==="training"?"Название тренировки":"Название упражнения"}<input tabIndex={-1} readOnly value={current.name}/></label><button tabIndex={-1} className="primary">Добавить</button></div></div>
  </div>
  {editor&&<DemoEditor kind={editor.kind} onClose={()=>setEditor(null)} onSave={(name,exercise)=>{setWeek(prev=>prev.map((list,d)=>d!==day?list:editor.kind==="training"?[...list,{id:id(),name,exercises:[]}]:list.map(t=>t.id===editor.trainingId&&exercise?{...t,exercises:[...t.exercises,exercise]}:t)));setEditor(null);}}/>}
  <div className="demo-bottom"><span aria-live={automatic?"off":"polite"}>{automatic?current.message:"Это пример. Записи исчезнут после обновления страницы."}</span><div className="demo-play-controls"><button type="button" onClick={takeControl}>{automatic?"Попробовать самому":"Ручной режим"}</button><button type="button" data-demo-replay onClick={()=>{setTime(0);setCollapsed([]);setAutomatic(true);}}>Повторить показ ↻</button></div></div>
 </div>;
}
