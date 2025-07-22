import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const payload = Object.keys(req.body || {}).length ? req.body : req.query;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode;
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} ${status} +${duration}ms ${JSON.stringify(payload)}`);
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const status = err.status || err.statusCode || 500;
        this.logger.error(
          `${method} ${url} ${status} +${duration}ms ${JSON.stringify(payload)} - ${err.message}`,
          err.stack,
        );
        throw err;
      }),
    );
  }
}
