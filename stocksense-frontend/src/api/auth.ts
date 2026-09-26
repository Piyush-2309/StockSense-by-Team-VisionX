import client from './client';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  RefreshResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
} from '../types/auth';
import type { User } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/auth/login', data),

  signup: (data: SignupRequest) =>
    client.post<User>('/auth/signup', data),

  refresh: (refreshToken: string) =>
    client.post<RefreshResponse>('/auth/refresh', { refreshToken }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    client.post('/auth/forgot-password', data),

  verifyOtp: (data: VerifyOtpRequest) =>
    client.post('/auth/verify-otp', data),

  resetPassword: (data: ResetPasswordRequest) =>
    client.post('/auth/reset-password', data),
};
