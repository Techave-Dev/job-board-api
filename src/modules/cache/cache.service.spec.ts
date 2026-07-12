import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { Redis } from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
    status: 'ready' as string,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: Redis, useValue: mockRedis },
      ],
    }).compile();

    service = module.get(CacheService);
    jest.resetAllMocks();
  });

  describe('isConnected', () => {
    it('should return true when Redis status is ready', () => {
      mockRedis.status = 'ready';
      expect(service.isConnected()).toBe(true);
    });

    it('should return false when Redis status is not ready', () => {
      mockRedis.status = 'connecting';
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('get', () => {
    it('should return parsed JSON on cache hit', async () => {
      const data = { name: 'test', count: 42 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await service.get<typeof data>('key');

      expect(result).toEqual(data);
      expect(mockRedis.get).toHaveBeenCalledWith('key');
    });

    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('missing');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('missing');
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.set('key', { foo: 'bar' });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ foo: 'bar' }),
      );
    });

    it('should set value with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await service.set('key', 'value', 300);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify('value'),
        'EX',
        300,
      );
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del('key');

      expect(mockRedis.del).toHaveBeenCalledWith('key');
    });
  });

  describe('scanAndDelete', () => {
    it('should delete all matching keys', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', ['jobs:1', 'jobs:2']]);

      await service.scanAndDelete('jobs:*');

      expect(mockRedis.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'jobs:*',
        'COUNT',
        100,
      );
      expect(mockRedis.del).toHaveBeenCalledWith('jobs:1', 'jobs:2');
    });

    it('should handle multiple scan pages', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['2', ['jobs:1']])
        .mockResolvedValueOnce(['0', ['jobs:2', 'jobs:3']]);

      await service.scanAndDelete('jobs:*');

      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('jobs:1');
      expect(mockRedis.del).toHaveBeenCalledWith('jobs:2', 'jobs:3');
    });

    it('should not call del when no keys match', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]);

      await service.scanAndDelete('nonexistent:*');

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});