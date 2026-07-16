import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { ApiResponse } from '../types/api-response';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockContext: ExecutionContext;
  const MOCK_REQUEST_ID = 'req_mock-1234-5678';

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          requestId: MOCK_REQUEST_ID,
        }),
      }),
    } as unknown as ExecutionContext;
  });

  function createCallHandler(returnValue: unknown): CallHandler {
    return {
      handle: () => of(returnValue),
    };
  }

  it('should format an ApiResponse instance correctly and append requestId', async () => {
    const apiResponse = new ApiResponse(
      'User created',
      { id: '1' },
      { page: 1 },
    );
    const callHandler = createCallHandler(apiResponse);
    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler),
    );

    expect(result.message).toBe('User created');
    expect(result.data).toEqual({ id: '1' });
    expect(result.meta).toEqual({ page: 1 });
    expect(result.requestId).toBe(MOCK_REQUEST_ID);
  });

  it('should wrap plain data with a default "Success" message and append requestId', async () => {
    const plainData = { foo: 'bar' };
    const callHandler = createCallHandler(plainData);

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler),
    );

    expect(result.message).toBe('Success');
    expect(result.data).toEqual(plainData);
    expect(result.requestId).toBe(MOCK_REQUEST_ID);
  });

  it('should wrap null/undefined data without throwing', async () => {
    const callHandler = createCallHandler(undefined);

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, callHandler),
    );

    expect(result.message).toBe('Success');
    expect(result.data).toBeUndefined();
    expect(result.requestId).toBe(MOCK_REQUEST_ID);
  });
});
