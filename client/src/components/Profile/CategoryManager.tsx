import { useEffect, useState } from "react";
import { useWorkoutStore } from "../../store/workoutStore";
import { axiosInstance } from "../../api/axiosInstance";
import { getErrorMessage } from "../../utils/errors";
export function CategoryManager() {
 const { categories, fetchCategories, error: loadError } = useWorkoutStore();
 const [editId, setEditId] = useState<string | null>(null);
 const [deleteId, setDeleteId] = useState<string | null>(null);
 const [name, setName] = useState("");
 const [replacement, setReplacement] = useState("");
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [message, setMessage] = useState("");
 useEffect(() => { let active = true; void fetchCategories().finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [fetchCategories]);
 const change = async (id: string, action: "rename" | "delete") => {
  setBusy(true); setError(""); setMessage("");
  try {
   if (action === "rename") await axiosInstance.patch("/workout/categories/" + id, {name: name.trim()});
   else await axiosInstance.delete("/workout/categories/" + id, {data: replacement ? {replacementCategoryId: replacement} : {}});
   setEditId(null); setDeleteId(null); await fetchCategories();
   setMessage(action === "rename" ? "Название исправлено." : "Категория удалена. Записи тренировок сохранены.");
  } catch (error) { setError(getErrorMessage(error)); }
  finally { setBusy(false); }
 };
 const custom = categories.filter(category => category.isCustom);
 return <section className="profile-card" id="categories"><div className="eyebrow">Порядок в дневнике</div><h2>Мои категории</h2><p className="muted">Исправь опечатку или убери лишнюю категорию. Общие группы мышц доступны всем и не удаляются.</p>
  {loading && <p role="status" className="weight-empty">Загружаем категории…</p>}
  {!loading && !custom.length && !loadError && <p className="weight-empty">Своих категорий пока нет. Их можно добавить в форме упражнения.</p>}
  <ul className="category-list">{custom.map(category => <li key={category.id}>
   <div className="category-line"><strong>{category.name}</strong><div><button disabled={busy} onClick={() => {setEditId(category.id); setName(category.name); setDeleteId(null); setError("");}}>Изменить</button><button disabled={busy} onClick={() => {setDeleteId(category.id); setEditId(null); setReplacement(""); setError("");}}>Удалить</button></div></div>
   {editId === category.id && <form className="category-editor" onSubmit={event => {event.preventDefault(); void change(category.id, "rename");}}><label>Название категории<input required disabled={busy} minLength={2} maxLength={30} value={name} onChange={event => setName(event.target.value)}/></label><div><button className="primary" disabled={busy || name.trim().length < 2}>Сохранить</button><button type="button" disabled={busy} onClick={() => setEditId(null)}>Отмена</button></div></form>}
   {deleteId === category.id && <div className="category-editor"><p>Если в категории есть упражнения, выбери для них другую группу. Тренировки и подходы останутся на месте.</p><label>Перенести упражнения в<select disabled={busy} value={replacement} onChange={event => setReplacement(event.target.value)}><option value="">Без переноса — если категория пустая</option>{categories.filter(item => item.id !== category.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div><button disabled={busy} className="danger-button" onClick={() => void change(category.id, "delete")}>Удалить категорию</button><button disabled={busy} onClick={() => setDeleteId(null)}>Отмена</button></div></div>}
  </li>)}</ul>
  {(error || loadError) && <p role="alert">{error || loadError}</p>}{message && <p role="status" className="profile-success">{message}</p>}
 </section>;
}
