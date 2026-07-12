import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when empty roles array', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user role matches', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['company']);
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnValue({ user: { role: 'company' } }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user role does not match', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['company']);
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnValue({ user: { role: 'applicant' } }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when no user in request', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['company']);
      const context = {
        switchToHttp: jest.fn().mockReturnThis(),
        getRequest: jest.fn().mockReturnValue({}),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
