import { ExceptionFilter, Catch, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/domain-exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    
    // We can define custom status codes based on exception types/codes
    if (exception.code === 'NOT_FOUND') {
      status = HttpStatus.NOT_FOUND;
    } else if (exception.code === 'UNAUTHORIZED') {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception.code === 'FORBIDDEN') {
      status = HttpStatus.FORBIDDEN;
    } else if (exception.code === 'CONFLICT') {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
