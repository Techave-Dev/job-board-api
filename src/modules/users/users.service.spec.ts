import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { UsersService } from './users.service';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  const mockRepository = mock<IUsersRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: IUsersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with createdAt', async () => {
      const now = new Date();
      mockRepository.findById.mockResolvedValue({
        id: '1',
        email: 'user@gmail.com',
        name: 'Test User',
        role: 'applicant',
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.getProfile('1');

      expect(result).toEqual({
        id: '1',
        email: 'user@gmail.com',
        name: 'Test User',
        role: 'applicant',
        createdAt: now,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const now = new Date();

    const existingUser = {
      id: '1',
      email: 'user@gmail.com',
      name: 'Test User',
      role: 'applicant' as const,
      createdAt: now,
      updatedAt: now,
    };

    it('should update name and return without createdAt', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.updateById.mockResolvedValue({
        ...existingUser,
        name: 'Updated Name',
      });

      const result = await service.updateProfile('1', { name: 'Updated Name' });

      expect(result).toEqual({
        id: '1',
        email: 'user@gmail.com',
        name: 'Updated Name',
        role: 'applicant',
      });
      expect(result).not.toHaveProperty('createdAt');
      expect(mockRepository.updateById).toHaveBeenCalledWith('1', {
        name: 'Updated Name',
      });
    });

    it('should update email if not taken by another user', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.updateById.mockResolvedValue({
        ...existingUser,
        email: 'newemail@gmail.com',
      });

      const result = await service.updateProfile('1', {
        email: 'newemail@gmail.com',
      });

      expect(result.email).toBe('newemail@gmail.com');
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        'newemail@gmail.com',
      );
    });

    it('should allow keeping the same email', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.updateById.mockResolvedValue(existingUser);

      const result = await service.updateProfile('1', {
        email: 'user@gmail.com',
      });

      expect(result.email).toBe('user@gmail.com');
      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already in use', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.findByEmail.mockResolvedValue({
        id: '2',
        email: 'taken@gmail.com',
        name: 'Other User',
        role: 'company',
        createdAt: now,
        updatedAt: now,
      });

      await expect(
        service.updateProfile('1', { email: 'taken@gmail.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('999', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
