export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  tenantName: string;
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantName: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export type AuthFormData = LoginCredentials | RegisterData | ForgotPasswordData | ResetPasswordData;