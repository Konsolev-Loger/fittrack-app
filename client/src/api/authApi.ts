import type { AuthResponse, LoginCredentials, LogoutResponse, RefreshResponse, RegisterData } from "../types/auth";
import { axiosInstance } from "./axiosInstance";
export const authApi = {
 register: async (data: RegisterData) => (await axiosInstance.post<{ message: string; data?: AuthResponse["data"] }>("/auth/register", data)).data,
 login: async (data: LoginCredentials) => (await axiosInstance.post<AuthResponse>("/auth/login", data)).data,
 refresh: async () => (await axiosInstance.post<RefreshResponse>("/auth/refresh")).data,
 logout: async () => (await axiosInstance.post<LogoutResponse>("/auth/logout")).data,
};
