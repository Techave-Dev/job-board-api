import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { RequestWithId } from '../middlewares/request-id.middleware';

interface ExceptionBody {
  message?: unknown;
  code?: unknown;
  error?: unknown;
}

function isExceptionBody(value: unknown): value is ExceptionBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Catch()
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const requestId = request.requestId;

    if (exception instanceof ZodError) {
      const errors = exception.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      response.status(HttpStatus.BAD_REQUEST).json({
        message: 'Validation failed',
        requestId,
        code: 'validation.failed',
        error: errors,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const body = isExceptionBody(exceptionResponse)
        ? exceptionResponse
        : undefined;

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : typeof body?.message === 'string'
            ? body.message
            : exception.message;

      const code = typeof body?.code === 'string' ? body.code : 'error';
      const error = Array.isArray(body?.error) ? body.error : undefined;

      response.status(status).json({
        message,
        requestId,
        code,
        ...(error ? { error } : {}),
      });
      return;
    }

    console.error({
      requestId,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      requestId,
      code: 'server.error',
    });
  }
}
