import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { IAuthService } from './interfaces/auth.service.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    rotate: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: IAuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return success response', async () => {
      const dto: RegisterDto = {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: 'password123',
        role: 'applicant',
      };

      const expectedUser = {
        id: '1',
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        role: 'applicant' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue({ user: expectedUser });

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('User registered successfully');
      expect(result.data).toEqual(expectedUser);
    });
  });

  describe('login', () => {
    it('should call authService.login and return user with tokens', async () => {
      const dto: LoginDto = {
        email: 'johndoe@gmail.com',
        password: 'password123',
      };

      const expectedUser = {
        id: '1',
        email: 'johndoe@gmail.com',
        name: 'John Doe',
        role: 'applicant' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tokens = { accessToken: 'acc_token', refreshToken: 'ref_token' };

      mockAuthService.login.mockResolvedValue({
        user: expectedUser,
        tokens,
      });

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Login successful');
      expect(result.data).toEqual({
        accessToken: 'acc_token',
        refreshToken: 'ref_token',
        user: expectedUser,
      });
    });
  });

  describe('refresh', () => {
    it('should call authService.rotate and return new tokens', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'old_token' };
      const newTokens = { accessToken: 'new_acc', refreshToken: 'new_ref' };

      mockAuthService.rotate.mockResolvedValue(newTokens);

      const result = await controller.refresh(dto);

      expect(mockAuthService.rotate).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Token rotated successfully');
      expect(result.data).toEqual(newTokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return no body (204)', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'test-token' };

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(dto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(dto);
      expect(result).toBeUndefined();
    });
  });
});
