import { UserRole } from './index';

export interface User {
  id: string;
  email: string | null;
  phone: string;
  passwordHash: string | null;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuth {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  permissions: string[];
}

export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  /** Restaurant/tenant name - required when role is TENANT_ADMIN */
  restaurantName?: string;
}

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string;
  avatar?: string | null;
}
