import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { z, ZodError } from 'zod';
import { ZodExceptionFilter } from './zod-exception.filter';

const MOCK_REQUEST_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createZodError(schema: z.ZodTypeAny, invalidInput: unknown): ZodError {
  const result = schema.safeParse(invalidInput);
  if (result.success) {
    throw new Error('Expected schema validation to fail in test setup');
  }
  return result.error;
}

describe('ZodExceptionFilter', () => {
  let filter: ZodExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { requestId: string; url: string; method: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ZodExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      requestId: MOCK_REQUEST_ID,
      url: '/test',
      method: 'GET',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost;
  });

  describe('when exception is a ZodError', () => {
    it('should respond with 400 and validation.failed code', () => {
      const schema = z.object({ email: z.string().email() });
      const zodError = createZodError(schema, { email: 123 });

      filter.catch(zodError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        code: string;
        error: Array<{ field: string; message: string }>;
      };
      expect(jsonArg.code).toBe('validation.failed');
      expect(jsonArg.error[0]?.field).toBe('email');
    });

    it('should join nested path with dots', () => {
      const schema = z.object({
        user: z.object({ profile: z.object({ name: z.string().min(1) }) }),
      });
      const zodError = createZodError(schema, {
        user: { profile: { name: '' } },
      });

      filter.catch(zodError, mockHost);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        error: Array<{ field: string }>;
      };
      expect(jsonArg.error[0]?.field).toBe('user.profile.name');
    });

    it('should include multiple errors when multiple fields are invalid', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      const zodError = createZodError(schema, { email: 123, age: 5 });

      filter.catch(zodError, mockHost);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        error: Array<{ field: string }>;
      };
      expect(jsonArg.error).toHaveLength(2);
    });
  });

  describe('when exception is an HttpException', () => {
    it('should use the string response as message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Not found', code: 'error' }),
      );
    });

    it('should extract message and code from object response', () => {
      const exception = new HttpException(
        { message: 'Email already registered', code: 'auth.user.exists' },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered',
          code: 'auth.user.exists',
        }),
      );
    });

    it('should fallback to code "error" when response has no code', () => {
      const exception = new HttpException(
        { message: 'Something went wrong' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'error' }),
      );
    });

    it('should fallback to exception.message when response has no string message', () => {
      const exception = new HttpException(
        { code: 'some.code' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        message: string;
      };
      expect(jsonArg.message).toBe(exception.message);
    });

    it('should forward field-level error array when present in body', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          code: 'validation.failed',
          error: [{ field: 'email', message: 'Invalid email' }],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        error: Array<{ field: string }>;
      };
      expect(jsonArg.error).toHaveLength(1);
      expect(jsonArg.error[0]?.field).toBe('email');
    });
  });

  describe('when exception is an unrecognized type', () => {
    it('should respond with 500 and server.error code', () => {
      filter.catch(new Error('unexpected'), mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'server.error' }),
      );
    });
  });

  describe('requestId', () => {
    it('should use requestId from the request object, not generate a new one', () => {
      filter.catch(new Error('boom'), mockHost);

      const calls = mockResponse.json.mock.calls as unknown[][];
      const jsonArg = calls[0][0] as {
        requestId: string;
      };
      expect(jsonArg.requestId).toBe(MOCK_REQUEST_ID);
    });
  });
});
