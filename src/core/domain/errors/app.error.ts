import { HttpException, HttpStatus } from './http.exception';
export interface ErrorParams {
  message: string;
  statusCode?: number;
  errorType?: string;
  details?: unknown;
}

export class AppError extends HttpException {
  errorType: string;
  details: unknown;

  constructor({
    message,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorType = 'ApplicationError',
    details,
  }: ErrorParams) {
    super(
      {
        message,
        statusCode,
        error: errorType,
        details,
      },
      statusCode,
    );
    this.errorType = errorType;
    this.details = details;
  }

  static notFound(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.NOT_FOUND,
      errorType: 'NotFoundError',
    });
  }

  static badRequest(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.BAD_REQUEST,
      errorType: 'BadRequestError',
    });
  }

  static unauthorized(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorType: 'UnauthorizedError',
    });
  }

  static forbidden(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.FORBIDDEN,
      errorType: 'ForbiddenError',
    });
  }

  static conflict(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.CONFLICT,
      errorType: 'ConflictError',
    });
  }

  static internal(params: Omit<ErrorParams, 'statusCode' | 'errorType'>) {
    return new AppError({
      ...params,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorType: 'InternalServerError',
    });
  }
}
