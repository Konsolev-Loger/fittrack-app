import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import type { RefreshResponse } from "../types/auth";

export const axiosInstance = axios.create({
	baseURL: "/api",
	headers: { "Content-Type": "application/json" },
	withCredentials: true,
	timeout: 15000,
});
type RequestConfig = InternalAxiosRequestConfig & { sent?: boolean; sessionVersion?: number };
let refreshPromise: Promise<string> | null = null;
let refreshVersion = -1;
export function refreshSession(): Promise<string> {
	const version = useAuthStore.getState().sessionVersion;
	if (refreshPromise && refreshVersion === version) return refreshPromise;
	refreshVersion = version;
	const promise = axiosInstance
		.post<RefreshResponse>("/auth/refresh")
		.then(({ data }) => {
			if (useAuthStore.getState().sessionVersion !== version) throw new axios.CanceledError("Сессия изменена");
			if (data.statusCode !== 200 || !data.data?.accessToken) throw new Error("Некорректный ответ обновления сессии");
			useAuthStore.setState({ accessToken: data.data.accessToken, user: data.data.user, isAuthenticated: true, error: null });
			return data.data.accessToken;
		})
		.catch((error: unknown) => {
			if (axios.isAxiosError(error) && error.response?.status === 401 && useAuthStore.getState().sessionVersion === version) {
				useAuthStore.getState().resetAuth();
			}
			throw error;
		})
		.finally(() => {
			if (refreshPromise === promise) refreshPromise = null;
		});
	refreshPromise = promise;
	return promise;
}
axiosInstance.interceptors.request.use((config: RequestConfig) => {
	const state = useAuthStore.getState();
	config.sessionVersion ??= state.sessionVersion;
	if (!config.url?.startsWith("/auth/")) {
		if (config.sessionVersion !== state.sessionVersion) throw new axios.CanceledError("Сессия изменена");
		if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
	}
	return config;
});
axiosInstance.interceptors.response.use(
	(response) => {
		const config = response.config as RequestConfig;
		if (!config.url?.startsWith("/auth/") && config.sessionVersion !== useAuthStore.getState().sessionVersion)
			throw new axios.CanceledError("Сессия изменена");
		return response;
	},
	async (error: AxiosError) => {
		const request = error.config as RequestConfig | undefined;
		if (request && error.response?.status === 401 && !request.sent && !request.url?.startsWith("/auth/")) {
			if (request.sessionVersion !== useAuthStore.getState().sessionVersion) throw new axios.CanceledError("Сессия изменена");
			request.sent = true;
			const token = await refreshSession();
			request.headers.Authorization = `Bearer ${token}`;
			return axiosInstance(request);
		}
		throw error;
	},
);
