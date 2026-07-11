import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'applicant' | 'company';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const IAuthService = Symbol('IAuthService');

export interface IAuthService {
  register(dto: RegisterDto): Promise<{ user: AuthUser }>;
  login(dto: LoginDto): Promise<{ user: AuthUser; tokens: AuthTokens }>;
  rotate(dto: RefreshTokenDto): Promise<AuthTokens>;
  logout(dto: RefreshTokenDto): Promise<void>;
}
