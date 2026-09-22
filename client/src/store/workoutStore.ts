import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../api/axiosInstance";
import { getErrorMessage } from "../utils/errors";
import { dateKey, localDate } from "../utils/dates";
export interface WorkoutSet { id: string; setNumber: number; weight: number; repsCount: number; exerciseId: string; }
interface Category { id: string; name: string; isCustom: boolean; }
interface Exercise { id: string; name: string; description?: string; isCompound: boolean; isFailure: boolean; isDropSet: boolean; category: Category; sets: WorkoutSet[]; }
interface WorkoutDay { id: string; date: string; weekNumber: number; month: number; year: number; exercises: Exercise[]; }
export interface ExerciseFormData { name: string; description: string; categoryId: string; setsCount: number; isCompound: boolean; isFailure: boolean; isDropSet: boolean; }
interface WorkoutState {
 categories: Category[]; monthlyWorkouts: WorkoutDay[]; calendarWorkouts: WorkoutDay[];
 selectedDate: Date; currentMonthView: Date; isLoading: boolean; calendarLoading: boolean; isSaving: boolean; error: string | null;
 isCalendarOpen: boolean;
 fetchCategories: () => Promise<void>; addCategory: (name: string) => Promise<boolean>;
 fetchMonthlyData: (month: number, year: number) => Promise<void>;
 fetchCalendarData: (month: number, year: number) => Promise<void>;
 addExercise: (data: ExerciseFormData) => Promise<boolean>;
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
 async addCategory(name) {
  const version = epoch; set({ error: null });
  try {
   const { data } = await axiosInstance.post<{ data: Category }>("/workout/categories", { name });
   if (version !== epoch) return false;
   set(state => ({ categories: [...state.categories, data.data].sort((a, b) => a.name.localeCompare(b.name)) })); return true;
  } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); return false; }
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
   if (!Number.isInteger(input.setsCount) || input.setsCount < 1 || input.setsCount > 100) throw new Error("Укажите от 1 до 100 подходов");
   const { setsCount, ...fields } = input;
   await axiosInstance.post("/workout/exercises", { ...fields, date, sets: Array.from({ length: setsCount }, (_, i) => ({ setNumber: i + 1, weight: 0, repsCount: 0 })) });
   if (version !== epoch) return false;
   const current = get().selectedDate;
   await get().fetchMonthlyData(current.getMonth() + 1, current.getFullYear());
   return true;
  } catch (error) { if (version === epoch) set({ error: getErrorMessage(error) }); return false; }
  finally { if (version === epoch) set({ isSaving: false }); }
 },
 async deleteExercise(id) {
  const version = epoch; set({ error: null });
  try {
   await axiosInstance.delete(`/workout/exercises/${id}`);
   if (version === epoch) set(state => ({ monthlyWorkouts: state.monthlyWorkouts.map(w => ({ ...w, exercises: w.exercises.filter(ex => ex.id !== id) })).filter(w => w.exercises.length) }));
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
