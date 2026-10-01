import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../api/axiosInstance";
import { getErrorMessage } from "../utils/errors";
import { dateKey, localDate } from "../utils/dates";
export interface WorkoutSet { id: string; setNumber: number; weight: number; repsCount: number; exerciseId: string; }
interface Category { id: string; name: string; isCustom: boolean; }
interface Exercise { distanceKm?: number | null; durationMinutes?: number | null; id: string; name: string; description?: string; isCompound: boolean; isFailure: boolean; isDropSet: boolean; category: Category; sets: WorkoutSet[]; }
interface WorkoutDay { name?: string | null; id: string; date: string; weekNumber: number; month: number; year: number; exercises: Exercise[]; }
export interface ExerciseFormData { workoutId?: string; distanceKm?: number; durationMinutes?: number; name: string; description: string; categoryId: string; setsCount: number; isCompound: boolean; isFailure: boolean; isDropSet: boolean; }
interface WorkoutState {
 categories: Category[]; monthlyWorkouts: WorkoutDay[]; calendarWorkouts: WorkoutDay[];
 selectedDate: Date; currentMonthView: Date; isLoading: boolean; calendarLoading: boolean; isSaving: boolean; error: string | null;
 isCalendarOpen: boolean;
 fetchCategories: () => Promise<void>;
 fetchMonthlyData: (month: number, year: number) => Promise<void>;
 fetchCalendarData: (month: number, year: number) => Promise<void>;
 addExercise: (data: ExerciseFormData) => Promise<boolean>;
 updateDuration: (id: string, durationMinutes: number) => Promise<boolean>;
 updateDistance: (id: string, distanceKm: number) => Promise<boolean>;
 addWorkout: (name:string) => Promise<boolean>;
 deleteEmptyWorkout: (id:string) => Promise<void>;
 deleteExercise: (id: string) => Promise<void>;
 setSelectedDate: (date: Date) => void; setCurrentMonthView: (date: Date) => void;
 setCalendarOpen: (open: boolean) => void;
 updateSetData: (id: string, exerciseId: string, data: { weight?: number; repsCount?: number }) => Promise<boolean>;
 reset: () => void;
 changeSets: (id: string, action: "add" | "delete") => Promise<boolean>;
}
let epoch = 0;
let monthRequest = 0;
let calendarRequest = 0;
const setQueues = new Map<string, Promise<boolean>>();
export const useWorkoutStore = create<WorkoutState>()(persist((set, get) => ({
 categories: [], monthlyWorkouts: [], calendarWorkouts: [], selectedDate: new Date(), currentMonthView: new Date(),
 isLoading: false, calendarLoading: false, isSaving: false, error: null, isCalendarOpen: false,
 reset() {
  epoch++; monthRequest++; calendarRequest++; setQueues.clear();
  set({ categories: [], monthlyWorkouts: [], calendarWorkouts: [], selectedDate: new Date(), currentMonthView: new Date(), isLoading: false, calendarLoading: false, isSaving: false, error: null, isCalendarOpen: false });
 },
 async fetchCategories() {
  const version = epoch;
  try { const { data } = await axiosInstance.get<{ data: Category[] }>("/workout/categories"); if (version === epoch) set({ categories: data.data }); }
  catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); }
 },
 async fetchMonthlyData(month, year) {
  const version = epoch, request = ++monthRequest;
  set({ isLoading: true, error: null, monthlyWorkouts: [] });
  try {
   const { data } = await axiosInstance.get<{ data: WorkoutDay[] }>("/workout/calendar", { params: { month, year } });
   if (version === epoch && request === monthRequest) set({ monthlyWorkouts: data.data, isLoading: false });
  } catch (error) { if (version === epoch && request === monthRequest) set({ isLoading: false, error: getErrorMessage(error) }); }
 },
 async fetchCalendarData(month, year) {
  const version = epoch, request = ++calendarRequest;
  set({ calendarLoading: true, calendarWorkouts: [] });
  try {
   const { data } = await axiosInstance.get<{ data: WorkoutDay[] }>("/workout/calendar", { params: { month, year } });
   if (version === epoch && request === calendarRequest) set({ calendarWorkouts: data.data, calendarLoading: false });
  } catch (error) { if (version === epoch && request === calendarRequest) set({ calendarLoading: false, error: getErrorMessage(error) }); }
 },
 async addExercise(input) {
  if (get().isSaving) return false;
  const version = epoch, date = dateKey(get().selectedDate);
  set({ isSaving: true, error: null });
  try {
   if (input.durationMinutes === undefined && (!Number.isInteger(input.setsCount) || input.setsCount < 1 || input.setsCount > 100)) throw new Error("Укажите от 1 до 100 подходов");
   const { setsCount, ...fields } = input;
   const response = await axiosInstance.post<{data:Exercise & {workoutId:string}}>("/workout/exercises", { ...fields, categoryId: input.durationMinutes === undefined ? fields.categoryId || undefined : undefined, date, sets: input.durationMinutes !== undefined ? [] : Array.from({ length: setsCount }, (_, i) => ({ setNumber: i + 1, weight: 0, repsCount: 0 })) });
   if (version !== epoch) return false;
   const exercise = response.data.data;
   set(state=>({monthlyWorkouts:state.monthlyWorkouts.map(w=>w.id === exercise.workoutId ? {...w,exercises:[...w.exercises,exercise]} : w)}));
   return true;
  } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); return false; }
  finally { if (version === epoch) set({ isSaving: false }); }
 },
 async addWorkout(name) {
  if (get().isSaving) return false;
  const version=epoch, date=dateKey(get().selectedDate);
  set({isSaving:true,error:null});
  try {
   const {data}=await axiosInstance.post<{data:WorkoutDay}>("/workout/sessions",{name,date});
   if(version!==epoch)return false;
   set(state=>({monthlyWorkouts:[...state.monthlyWorkouts,data.data]}));
   return true;
  } catch(error){if(version===epoch)set({error:getErrorMessage(error)});return false;}
  finally{if(version===epoch)set({isSaving:false});}
 },
 async deleteEmptyWorkout(id) {
  const version=epoch;
  try {await axiosInstance.delete(`/workout/sessions/${id}`);if(version===epoch)set(state=>({monthlyWorkouts:state.monthlyWorkouts.filter(w=>w.id!==id)}));}
  catch(error){if(version===epoch)set({error:getErrorMessage(error)});}
 },
 async updateDistance(id, distanceKm) {
  const version=epoch;
  try {
   await axiosInstance.patch(`/workout/exercises/${id}/duration`,{distanceKm});
   if(version!==epoch)return false;
   set(state=>({monthlyWorkouts:state.monthlyWorkouts.map(w=>({...w,exercises:w.exercises.map(ex=>ex.id===id?{...ex,distanceKm}:ex)}))}));return true;
  }catch(error){if(version===epoch)set({error:getErrorMessage(error)});return false;}
 },
 async updateDuration(id, durationMinutes) {
  const version = epoch;
  try {
   await axiosInstance.patch(`/workout/exercises/${id}/duration`, {durationMinutes});
   if (version !== epoch) return false;
   set(state => ({monthlyWorkouts:state.monthlyWorkouts.map(w => ({...w,exercises:w.exercises.map(ex => ex.id === id ? {...ex,durationMinutes} : ex)}))}));
   return true;
  } catch (error) { if (version === epoch) set({error:getErrorMessage(error)}); return false; }
 },
 async deleteExercise(id) {
  const version = epoch; set({ error: null });
  try {
   await axiosInstance.delete(`/workout/exercises/${id}`);
   if (version === epoch) set(state => ({ monthlyWorkouts: state.monthlyWorkouts.map(w => ({ ...w, exercises: w.exercises.filter(ex => ex.id !== id) })).filter(w => w.name || w.exercises.length) }));
  } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); }
 },
 setSelectedDate: date => set({ selectedDate: date, currentMonthView: new Date(date.getFullYear(), date.getMonth(), 1), monthlyWorkouts: [] }),
 setCurrentMonthView: date => set({ currentMonthView: date }),
 setCalendarOpen: open => set({ isCalendarOpen: open }),
 async changeSets(id, action) {
  if (get().isSaving) return false;
  const version = epoch;
  set({ isSaving: true, error: null });
  try {
   await Promise.all([...setQueues.values()]);
   if (version !== epoch) return false;
   const response = action === "delete"
    ? await axiosInstance.delete<{ data: { exerciseId: string; sets: WorkoutSet[] } }>(`/workout/sets/${id}`)
    : await axiosInstance.post<{ data: { exerciseId: string; sets: WorkoutSet[] } }>(`/workout/exercises/${id}/sets`);
   if (version !== epoch) return false;
   const { exerciseId, sets } = response.data.data;
   set(state => ({ monthlyWorkouts: state.monthlyWorkouts.map(w => ({ ...w, exercises: w.exercises.map(ex => ex.id === exerciseId ? { ...ex, sets } : ex) })) }));
   return true;
  } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); return false; }
  finally { if (version === epoch) set({ isSaving: false }); }
 },
 updateSetData(id, exerciseId, fields) {
  const version = epoch;
  const previous = setQueues.get(id) ?? Promise.resolve(true);
  const task = previous.catch(() => false).then(async () => {
   if (version !== epoch) return false;
   try {
    const { data } = await axiosInstance.patch<{ data: WorkoutSet }>(`/workout/sets/${id}`, fields);
    if (version !== epoch) return false;
    set(state => ({ monthlyWorkouts: state.monthlyWorkouts.map(w => ({ ...w, exercises: w.exercises.map(ex => ex.id !== exerciseId ? ex : { ...ex, sets: ex.sets.map(s => s.id === id ? data.data : s) }) })) }));
    return true;
   } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); return false; }
  });
  setQueues.set(id, task);
  void task.finally(() => { if (setQueues.get(id) === task) setQueues.delete(id); });
  return task;
 },
}), {
 name: "workout-navigation-storage",
 partialize: state => ({ selectedDate: dateKey(state.selectedDate), currentMonthView: dateKey(state.currentMonthView) }),
 merge: (persisted, current) => {
  const saved = persisted as { selectedDate?: string; currentMonthView?: string } | undefined;
  return { ...current, selectedDate: saved?.selectedDate ? localDate(saved.selectedDate) : current.selectedDate, currentMonthView: saved?.currentMonthView ? localDate(saved.currentMonthView) : current.currentMonthView };
 },
}));
