import { Injectable } from '@nestjs/common';
import {
  IUsersRepository,
  UpdateUserInput,
  User,
} from './interfaces/users.repository.interface';
import {
  getUserById,
  getUserByEmail,
  updateUser,
  listUserIdsByRole,
} from '../../generated/prisma/sql';
import { PrismaService } from '../../prisma/prisma.service';
import { nullableParam } from '../../common/utils/typed-sql.util';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const [user] = await this.prisma.$queryRawTyped(getUserById(BigInt(id)));
    if (!user) return null;

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.prisma.$queryRawTyped(getUserByEmail(email));
    if (!user) return null;

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateById(id: string, data: UpdateUserInput): Promise<User> {
    const [user] = await this.prisma.$queryRawTyped(
      updateUser(
        BigInt(id),
        nullableParam(data.name),
        nullableParam(data.email),
      ),
    );

    if (!user) {
      throw new Error('Failed to update user');
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listIdsByRole(role: 'applicant' | 'company'): Promise<string[]> {
    const rows = await this.prisma.$queryRawTyped(listUserIdsByRole(role));
    return rows.map((r) => r.id.toString());
  }
}
