export interface HttpExceptionResponse {
  message: string;
  statusCode: number;
  error?: string;
  details?: unknown;
}

export enum HttpStatus {
  SUCCESS = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export class HttpException extends Error {
  statusCode: number;
  response: HttpExceptionResponse;

  constructor(response: HttpExceptionResponse | string, statusCode: number) {
    super(typeof response === 'string' ? response : response.message);

    this.statusCode = statusCode;

    if (typeof response === 'string') {
      this.response = {
        statusCode,
        message: response,
      };
    } else {
      this.response = response;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
