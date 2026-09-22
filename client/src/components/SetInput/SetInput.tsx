import { useState } from "react";
interface Props {
 value: number; label: string; integer?: boolean; disabled?: boolean; className?: string;
 save: (value: number) => Promise<boolean>;
}
export function SetInput({ value, label, integer, disabled, className, save }: Props) {
 const [draft, setDraft] = useState(String(value));
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const commit = async () => {
  if (disabled || saving) return;
  const number = Number(draft);
  if (!draft.trim() || !Number.isFinite(number) || number < 0 || number > 10000 || (integer && !Number.isInteger(number))) {
   setError(integer ? "Укажите целое число от 0 до 10000" : "Укажите вес от 0 до 10000"); return;
  }
  if (number === value) { setError(""); return; }
  setSaving(true); setError("");
  try {
   if (!await save(number)) { setDraft(String(value)); setError("Не сохранено. Повторите ввод."); }
  } finally { setSaving(false); }
 };
 return <span className="set-field">
  <input type="number" aria-label={label} aria-invalid={!!error} min={0} max={10000}
   step={integer ? 1 : "any"} value={draft} disabled={disabled || saving} className={className}
   onChange={event => { setDraft(event.target.value); setError(""); }}
   onBlur={() => void commit()} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  <small className="set-feedback" role={error ? "alert" : "status"}>{error || (saving ? "Сохраняем…" : "\u00a0")}</small>
 </span>;
}
