import { UpdateUserDto } from '../dto/update-user.dto';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'applicant' | 'company';
  createdAt: Date;
}

export const IUsersService = Symbol('IUsersService');

export interface IUsersService {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<UserProfile, 'createdAt'>>;
}
