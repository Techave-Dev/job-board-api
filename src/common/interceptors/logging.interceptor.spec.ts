import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  const MOCK_REQUEST_ID = 'req_mock-1234-5678';
  const MOCK_USER = { userId: '100', role: 'applicant' };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1050);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createContext(overrides?: {
    requestId?: string;
    user?: unknown;
    statusCode?: number;
  }): ExecutionContext {
    const hasUser = overrides && 'user' in overrides;
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: overrides?.requestId ?? MOCK_REQUEST_ID,
          method: 'GET',
          url: '/jobs',
          ...(hasUser ? { user: overrides.user } : { user: MOCK_USER }),
        }),
        getResponse: () => ({
          statusCode: overrides?.statusCode ?? 200,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  function createCallHandler(): CallHandler {
    return {
      handle: () => of({ data: 'test' }),
    };
  }

  it('should log request with method, path, status, duration, userId, and requestId', async () => {
    const context = createContext();
    const callHandler = createCallHandler();

    await lastValueFrom(interceptor.intercept(context, callHandler));

    expect(logSpy).toHaveBeenCalledWith({
      requestId: MOCK_REQUEST_ID,
      userId: '100',
      method: 'GET',
      path: '/jobs',
      status: 200,
      duration: 50,
      message: 'GET /jobs 200',
    });
  });

  it('should log with userId undefined when user is not present', async () => {
    const context = createContext({ user: undefined });
    const callHandler = createCallHandler();

    await lastValueFrom(interceptor.intercept(context, callHandler));

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('should log correct status code', async () => {
    const context = createContext({ statusCode: 201 });
    const callHandler = createCallHandler();

    await lastValueFrom(interceptor.intercept(context, callHandler));

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 201, message: 'GET /jobs 201' }),
    );
  });
});
