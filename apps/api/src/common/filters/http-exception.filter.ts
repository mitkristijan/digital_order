import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    const errorMessage = typeof message === 'object' ? (message as any).message : message;
    const stack = exception instanceof Error ? exception.stack : undefined;

    // Log 500 errors
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} ${status}: ${errorMessage}`);
      if (stack) this.logger.error(stack);
    }

    // For 500: always include error message in response so you can debug via Network tab (no log access needed)
    const body: Record<string, unknown> = {
      statusCode: status,
      message: errorMessage,
      error: status >= 500 ? 'Internal Server Error' : undefined,
    };
    if (process.env.DEBUG_ERRORS === 'true' && status >= 500 && stack) {
      body.debug = { stack: stack.split('\n').slice(0, 8) };
    }

    response.status(status).json(body);
  }
}
