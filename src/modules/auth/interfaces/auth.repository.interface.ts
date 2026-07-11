export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role: 'applicant' | 'company';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'applicant' | 'company';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRefreshTokenInput {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

export const IAuthRepository = Symbol('IAuthRepository');

export interface IAuthRepository {
  createUser(data: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createRefreshToken(data: CreateRefreshTokenInput): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  revokeRefreshToken(token: string): Promise<void>;
  findPasswordByEmail(
    email: string,
  ): Promise<{ id: string; passwordHash: string } | null>;
  revokeAllRefreshTokens(userId: string): Promise<void>;
}
