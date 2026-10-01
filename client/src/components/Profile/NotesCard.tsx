import { useEffect, useState } from "react";
import { axiosInstance } from "../../api/axiosInstance";
import { getErrorMessage } from "../../utils/errors";
type Note = {id:string;content:string;updatedAt:string};
export function NotesCard() {
 const [notes,setNotes]=useState<Note[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [draft,setDraft]=useState("");
 const [removing,setRemoving]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;
  axiosInstance.get<{data:Note[]}>("/profile/notes").then(({data})=>{if(active){setNotes(data.data);setError("");}}).catch(error=>{if(active)setError(getErrorMessage(error));}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[retry]);
 const save=async()=>{
  if(busy||!draft.trim())return;
  setBusy(true);setError("");
  try {
   const {data}=editing==="new" ? await axiosInstance.post<{data:Note}>("/profile/notes",{content:draft.trim()}) : await axiosInstance.patch<{data:Note}>(`/profile/notes/${editing}`,{content:draft.trim()});
   setNotes(items=>[data.data,...items.filter(note=>note.id!==data.data.id)]);setEditing(null);setDraft("");
  }catch(error){setError(getErrorMessage(error));}finally{setBusy(false);}
 };
 const remove=async(id:string)=>{
  if(busy)return;
  setBusy(true);setError("");
  try{await axiosInstance.delete(`/profile/notes/${id}`);setNotes(items=>items.filter(note=>note.id!==id));setRemoving(null);}
  catch(error){setError(getErrorMessage(error));}finally{setBusy(false);}
 };
 return <section className="profile-card notes-card"><div className="notes-heading"><h2>Мои заметки</h2>{editing===null&&<button disabled={loading||busy} type="button" onClick={()=>{setEditing("new");setDraft("");setRemoving(null);}}>+ Добавить заметку</button>}</div>
  {loading&&<p role="status">Загрузка…</p>}
  {error&&<p role="alert">{error} {editing===null&&<button disabled={busy} onClick={()=>{setLoading(true);setRetry(value=>value+1);}}>Повторить загрузку</button>}</p>}
  {editing!==null&&<form className="note-editor" onSubmit={event=>{event.preventDefault();void save();}}><label>Заметка<textarea autoFocus required maxLength={5000} value={draft} disabled={busy} placeholder="Идеи для тренировок, цели или напоминания" onChange={event=>setDraft(event.target.value)}/></label><div><button className="primary" disabled={busy||!draft.trim()}>{busy?"Сохраняем…":"Сохранить"}</button><button type="button" disabled={busy} onClick={()=>setEditing(null)}>Отмена</button></div></form>}
  {!loading&&!error&&!notes.length&&editing===null&&<p className="weight-empty">Сохраняй здесь идеи, цели и напоминания для себя.</p>}
  <ul className="notes-list">{notes.map(note=><li key={note.id}><p>{note.content}</p><div className="note-actions"><small>{new Date(note.updatedAt).toLocaleDateString("ru-RU")}</small>{removing===note.id?<><span>Удалить заметку?</span><button disabled={busy} onClick={()=>void remove(note.id)}>Удалить</button><button disabled={busy} onClick={()=>setRemoving(null)}>Отмена</button></>:<><button disabled={busy||editing!==null} onClick={()=>{setEditing(note.id);setDraft(note.content);setRemoving(null);}}>Изменить</button><button disabled={busy||editing!==null} onClick={()=>setRemoving(note.id)}>Удалить</button></>}</div></li>)}</ul>
 </section>;
}
