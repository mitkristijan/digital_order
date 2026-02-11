import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025 = Record not found - return 404 instead of 500
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
      }
      // P2003 = Foreign key constraint failed
      else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
      }
    }

    let message: string | object;
    if (exception instanceof HttpException) {
      message = exception.getResponse();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') message = 'Record not found';
      else if (exception.code === 'P2003') message = 'Invalid reference: ' + (exception.meta?.field_name || exception.message);
      else message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = 'Internal server error';
    }

    const errorMessage = typeof message === 'object' ? (message as any).message : message;
    const stack = exception instanceof Error ? exception.stack : undefined;
    const prismaCode = exception instanceof Prisma.PrismaClientKnownRequestError ? exception.code : undefined;

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
    if (prismaCode) body.code = prismaCode;
    if (process.env.DEBUG_ERRORS === 'true' && status >= 500 && stack) {
      body.debug = { stack: stack.split('\n').slice(0, 12) };
    }

    response.status(status).json(body);
  }
}
