import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithId } from '../middlewares/request-id.middleware';
import { Response } from 'express';

interface RequestWithUser extends RequestWithId {
  user?: { userId?: string; role?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, requestId, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse<Response>();
        const status = response.statusCode;

        this.logger.log({
          requestId,
          userId: user?.userId,
          method,
          path: url,
          status,
          duration,
          message: `${method} ${url} ${status}`,
        });
      }),
    );
  }
}
