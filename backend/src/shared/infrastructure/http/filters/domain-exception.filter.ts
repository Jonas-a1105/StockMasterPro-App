import { ExceptionFilter, Catch, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/domain-exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.status || HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
