export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
}

export interface UserWithPassword extends UserPayload {
  password: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface TokenPayload { userId: string; sessionId: string; kind: "access" | "refresh"; }
