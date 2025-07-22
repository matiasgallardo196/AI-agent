import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error(
      `${request.method} ${request.originalUrl} - ${exception.message}`,
      exception.stack,
    );

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      response.status(status).json(res);
    } else {
      response.status(status).json({ message: 'Internal server error' });
    }
  }
}
