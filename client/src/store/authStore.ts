import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/authApi";
import { refreshSession } from "../api/axiosInstance";
import { getErrorMessage } from "../utils/errors";
import { useWorkoutStore } from "./workoutStore";
import type { LoginCredentials, RegisterData, User } from "../types/auth";
interface AuthState {
 user: User | null; accessToken: string | null; isLoading: boolean; error: string | null;
 isAuthenticated: boolean; isInitialized: boolean; sessionVersion: number;
 login: (credentials: LoginCredentials) => Promise<void>;
 register: (data: RegisterData) => Promise<string>;
 logout: () => Promise<void>; refreshTokens: () => Promise<boolean>;
 clearError: () => void; resetAuth: () => void;
}
export const useAuthStore = create<AuthState>()(persist((set, get) => ({
 user: null, accessToken: null, isLoading: false, error: null, isAuthenticated: false, isInitialized: false, sessionVersion: 0,
 resetAuth() {
  useWorkoutStore.getState().reset();
  set(state => ({ user: null, accessToken: null, isAuthenticated: false, sessionVersion: state.sessionVersion + 1 }));
 },
 async login(credentials) {
  get().resetAuth(); set({ isLoading: true, error: null });
  const version = get().sessionVersion;
  try {
   const response = await authApi.login(credentials);
   if (get().sessionVersion !== version) return;
   set({ ...response.data, isAuthenticated: true, isInitialized: true });
  } catch (error) { if (get().sessionVersion === version) set({ error: getErrorMessage(error) }); throw error; }
  finally { if (get().sessionVersion === version) set({ isLoading: false }); }
 },
 async register(data) {
  get().resetAuth(); set({ isLoading: true, error: null });
  const version = get().sessionVersion;
  try {
   const response = await authApi.register(data);
   if (get().sessionVersion !== version) throw new Error("Сессия изменена");
   if (response.data?.accessToken) set({ ...response.data, isAuthenticated: true, isInitialized: true });
   else set({ isInitialized: true });
   return response.message;
  } catch (error) { if (get().sessionVersion === version) set({ error: getErrorMessage(error) }); throw error; }
  finally { if (get().sessionVersion === version) set({ isLoading: false }); }
 },
 async logout() {
  set({ isLoading: true, error: null });
  try {
   await authApi.logout();
   get().resetAuth();
  } catch (error) {
   // Keep the session visible so the user can retry a failed server logout.
   set({ error: getErrorMessage(error) });
  } finally { set({ isLoading: false }); }
 },
 async refreshTokens() {
  set({ isLoading: true, error: null });
  try { await refreshSession(); return true; }
  catch (error) {
   if (!axios.isAxiosError(error) || error.response?.status !== 401) set({ error: getErrorMessage(error) });
   return false;
  }
  finally { set({ isLoading: false, isInitialized: true }); }
 },
 clearError: () => set({ error: null }),
}), { name: "auth-storage", version: 1, migrate: () => ({}), partialize: () => ({}) }));
