import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';
import { AppError } from '../../../core/domain/errors/app.error';
import { JwtPayload } from '../../../core/domain/interfaces/jwt-payload.interface';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let service: JwtService;
  const mockSecret = 'test-jwt-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
    service = new JwtService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('constructor', () => {
    it('should throw error if JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => new JwtService()).toThrow('JWT_SECRET is not defined');
    });

    it('should initialize successfully with JWT_SECRET', () => {
      process.env.JWT_SECRET = mockSecret;
      
      expect(() => new JwtService()).not.toThrow();
    });
  });

  describe('createToken', () => {
    const mockPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente' as const,
      name: 'John Doe',
    };

    it('should create a JWT token successfully', async () => {
      const mockToken = 'generated.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await service.createToken(mockPayload);

      expect(jwt.sign).toHaveBeenCalledWith(
        mockPayload,
        mockSecret,
        expect.objectContaining({
          expiresIn: '30d',
          issuer: 'auth-service',
        })
      );
      expect(result).toBe(mockToken);
    });

    it('should create token for employee', async () => {
      const employeePayload = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario' as const,
        name: 'Jane Employee',
      };

      const mockToken = 'employee.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await service.createToken(employeePayload);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        employeePayload,
        mockSecret,
        expect.any(Object)
      );
    });

    it('should create token without name', async () => {
      const payloadWithoutName = {
        sub: 'client_uuid',
        cpf: '',
        user_type: 'cliente' as const,
      };

      const mockToken = 'client.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await service.createToken(payloadWithoutName);

      expect(result).toBe(mockToken);
    });

    it('should throw internal error if jwt.sign fails', async () => {
      const error = new Error('Signing failed');
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(service.createToken(mockPayload)).rejects.toThrow(AppError);
      await expect(service.createToken(mockPayload)).rejects.toMatchObject({
        errorType: 'InternalServerError',
      });
    });

    it('should handle non-Error exceptions', async () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      await expect(service.createToken(mockPayload)).rejects.toThrow(AppError);
    });
  });

  describe('validateToken', () => {
    const validToken = 'valid.jwt.token';
    const mockDecodedPayload: JwtPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should validate token successfully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedPayload);

      const result = await service.validateToken(validToken);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, mockSecret);
      expect(result).toEqual(mockDecodedPayload);
    });

    it('should validate employee token', async () => {
      const employeePayload: JwtPayload = {
        ...mockDecodedPayload,
        cpf: '98765432109',
        user_type: 'funcionario',
      };

      (jwt.verify as jest.Mock).mockReturnValue(employeePayload);

      const result = await service.validateToken(validToken);

      expect(result.user_type).toBe('funcionario');
    });

    it('should throw unauthorized error for expired token', async () => {
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(AppError);
      await expect(service.validateToken(validToken)).rejects.toMatchObject({
        errorType: 'UnauthorizedError',
      });
    });

    it('should throw unauthorized error for invalid token', async () => {
      const invalidError = new jwt.JsonWebTokenError('Invalid token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(AppError);
      await expect(service.validateToken(validToken)).rejects.toMatchObject({
        errorType: 'UnauthorizedError',
      });
    });

    it('should throw internal error for unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw unexpectedError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(AppError);
      await expect(service.validateToken(validToken)).rejects.toMatchObject({
        errorType: 'InternalServerError',
      });
    });

    it('should handle non-Error exceptions', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(AppError);
    });
  });

  describe('decodeToken', () => {
    const validToken = 'valid.jwt.token';
    const mockDecodedPayload: JwtPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should decode token successfully', () => {
      (jwt.decode as jest.Mock).mockReturnValue(mockDecodedPayload);

      const result = service.decodeToken(validToken);

      expect(jwt.decode).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockDecodedPayload);
    });

    it('should return null if decoding fails', () => {
      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Decode failed');
      });

      const result = service.decodeToken('invalid.token');

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      (jwt.decode as jest.Mock).mockReturnValue(null);

      const result = service.decodeToken('malformed');

      expect(result).toBeNull();
    });
  });
});
