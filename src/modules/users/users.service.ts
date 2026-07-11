import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  IUsersService,
  UserProfile,
} from './interfaces/users.service.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUsersRepository } from './interfaces/users.repository.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(IUsersRepository)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: 'users.not_found',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<UserProfile, 'createdAt'>> {
    const existing = await this.usersRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException({
        code: 'users.not_found',
        message: 'User not found',
      });
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.usersRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictException({
          code: 'users.email_exists',
          message: 'Email already in use',
        });
      }
    }

    const updated = await this.usersRepository.updateById(userId, dto);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    };
  }
}
