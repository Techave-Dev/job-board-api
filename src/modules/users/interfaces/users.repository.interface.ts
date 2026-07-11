export interface User {
  id: string;
  email: string;
  name: string;
  role: 'applicant' | 'company';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export const IUsersRepository = Symbol('IUsersRepository');

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateById(id: string, data: UpdateUserInput): Promise<User>;
}
