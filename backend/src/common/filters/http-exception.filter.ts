import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message || exception.message;
        error = body.error || exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message;
    } else {
      this.logger.error(
        `Unknown error at ${request.method} ${request.url}: ${String(exception)}`,
      );
    }

    // Format single readable string if array
    const readableMessage = Array.isArray(message) ? message.join(', ') : message;

    response.status(status).json({
      statusCode: status,
      message: readableMessage,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
