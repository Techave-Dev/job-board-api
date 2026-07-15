import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

interface ErrorResponseFormat {
  message: string;
  code: string;
  error: Array<{
    field: string;
    message: string;
  }>;
}

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(3, 'Name too short'),
    email: z.string().email('Invalid email'),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  it('should return parsed data when validation succeeds', () => {
    const validData = {
      name: 'Rio',
      email: 'rio@example.com',
    };

    const result = pipe.transform(validData);
    expect(result).toEqual(validData);
  });

  it('should throw a BadRequestException with correct payload when validation fails', () => {
    const invalidData = {
      name: 'Ri',
      email: 'not-an-email',
    };

    let thrownError: BadRequestException | undefined;

    try {
      pipe.transform(invalidData);
    } catch (error) {
      thrownError = error as BadRequestException;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(BadRequestException);
    const errorResponse = thrownError?.getResponse() as ErrorResponseFormat;
    expect(errorResponse).toEqual({
      message: 'Validation failed',
      code: 'validation.failed',
      error: [
        { field: 'name', message: 'Name too short' },
        { field: 'email', message: 'Invalid email' },
      ],
    });
  });

  it('should map nested field paths correctly using dot notation', () => {
    const nestedSchema = z.object({
      address: z.object({
        city: z.string().min(1, 'City is required'),
      }),
    });
    const nestedPipe = new ZodValidationPipe(nestedSchema);

    let thrownError: BadRequestException | undefined;

    try {
      nestedPipe.transform({ address: { city: '' } });
    } catch (error) {
      thrownError = error as BadRequestException;
    }

    const errorResponse = thrownError?.getResponse() as ErrorResponseFormat;

    expect(errorResponse?.error[0]).toEqual({
      field: 'address.city',
      message: 'City is required',
    });
  });
});
