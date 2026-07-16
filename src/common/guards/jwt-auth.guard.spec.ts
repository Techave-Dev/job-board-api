import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuards } from './jwt-auth.guard';

describe('JwtAuthGuards', () => {
  let guard: JwtAuthGuards;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuards(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when route is @Public()', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should call super.canActivate when route is not public', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const spy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      spy.mockReturnValue(true);

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(context);
    });
  });
});
