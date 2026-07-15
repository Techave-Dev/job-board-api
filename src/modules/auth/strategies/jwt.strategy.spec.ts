import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { IAuthRepository } from '../interfaces/auth.repository.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockAuthRepository = {
    findById: jest.fn(),
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    strategy = new JwtStrategy(
      mockAuthRepository as unknown as IAuthRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return RequestUser when user found', async () => {
      const payload = { sub: '1', email: 'user@gmail.com' };
      mockAuthRepository.findById.mockResolvedValue({
        id: '1',
        email: 'user@gmail.com',
        name: 'Test User',
        role: 'applicant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '1',
        email: 'user@gmail.com',
        name: 'Test User',
        role: 'applicant',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: '999', email: 'notfound@gmail.com' };
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
