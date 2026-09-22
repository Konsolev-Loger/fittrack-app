import { useState } from "react";

const muscles = ["Грудь", "Спина", "Плечи", "Руки", "Ноги", "Пресс"];
export function MuscleMarquee() {
 const [paused, setPaused] = useState(false);
 return <section className="muscle-section" aria-label="Мышечные группы">
  <div className="shell muscle-heading"><span className="eyebrow">Каждой группе мышц — своё внимание</span><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Продолжить движение" : "Остановить движение"}</button></div>
  <div className={"muscle-window" + (paused ? " paused" : "")}>
   <div className="muscle-track">
    {[0, 1].map(copy => <div className="muscle-strip" key={copy} aria-hidden={copy === 1 ? true : undefined}>
     <img src="/muscle-groups.png" width="2172" height="724" alt={copy === 0 ? "Иллюстрации мышц груди, спины, плеч, рук, ног и пресса" : ""}/>
     <div className="muscle-labels">{muscles.map(name => <span key={name}>{name}</span>)}</div>
    </div>)}
   </div>
  </div>
 </section>;
}
