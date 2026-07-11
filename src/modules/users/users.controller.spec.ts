import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { IUsersService } from './interfaces/users.service.interface';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: IUsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return ApiResponse with user profile', async () => {
      const now = new Date();
      const expectedUser = {
        id: '1',
        email: 'user@gmail.com',
        name: 'Test User',
        role: 'applicant',
        createdAt: now,
      };
      mockUsersService.getProfile.mockResolvedValue(expectedUser);

      const result = await controller.getProfile('1');

      expect(mockUsersService.getProfile).toHaveBeenCalledWith('1');
      expect(result.message).toBe('Profile fetched successfully');
      expect(result.data).toEqual(expectedUser);
    });
  });

  describe('updateProfile', () => {
    it('should return ApiResponse with updated user', async () => {
      const expectedUser = {
        id: '1',
        email: 'newemail@gmail.com',
        name: 'Updated User',
        role: 'applicant',
      };
      mockUsersService.updateProfile.mockResolvedValue(expectedUser);

      const result = await controller.updateProfile('1', {
        name: 'Updated User',
        email: 'newemail@gmail.com',
      });

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('1', {
        name: 'Updated User',
        email: 'newemail@gmail.com',
      });
      expect(result.message).toBe('Profile updated successfully');
      expect(result.data).toEqual(expectedUser);
    });
  });
});
