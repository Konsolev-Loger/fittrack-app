export interface User { id: string; email: string; name: string | null; }
export interface LoginCredentials { email: string; password: string; }
export interface RegisterData extends LoginCredentials { name?: string; }
export interface AuthResponse { statusCode: number; message: string; data: { user: User; accessToken: string }; error: string | { field: string; message: string }[] | null; }
export type RefreshResponse = AuthResponse;
export interface LogoutResponse { statusCode: number; message: string; }
