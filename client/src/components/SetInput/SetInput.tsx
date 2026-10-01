import { useState } from "react";
interface Props {
 value: number; label: string; min?: number; max?: number; integer?: boolean; disabled?: boolean; className?: string;
 save: (value: number) => Promise<boolean>;
}
export function SetInput({ value, label, integer, disabled, className, save, min = 0, max = 10000 }: Props) {
 const [draft, setDraft] = useState(String(value));
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const commit = async () => {
  if (disabled || saving) return;
  if (!draft.trim()) { setDraft(String(value)); setError(""); return; }
  const number = Number(draft);
  if (!draft.trim() || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
   setError(integer ? `Укажите целое число от ${min} до ${max}` : `Укажите число от ${min} до ${max}`); return;
  }
  if (number === value) { setError(""); return; }
  setSaving(true); setError("");
  try {
   if (!await save(number)) { setDraft(String(value)); setError("Не сохранено. Повторите ввод."); }
  } finally { setSaving(false); }
 };
 return <span className="set-field">
  <input type="number" aria-label={label} aria-invalid={!!error} min={min} max={max}
   step={integer ? 1 : "any"} value={draft} disabled={disabled || saving} className={className}
   inputMode={integer ? "numeric" : "decimal"}
   onFocus={event => { if (draft === "0") setDraft(""); else event.currentTarget.select(); }}
   onChange={event => { setDraft(event.target.value); setError(""); }}
   onBlur={() => void commit()} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  <small className="set-feedback" role={error ? "alert" : "status"}>{error || (saving ? "Сохраняем…" : "\u00a0")}</small>
 </span>;
}
