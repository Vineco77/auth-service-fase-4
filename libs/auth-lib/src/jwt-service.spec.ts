import { JwtService } from './jwt-service';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './interfaces/jwt-payload.interface';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let service: JwtService;
  const mockSecret = 'test-jwt-secret';

  beforeEach(() => {
    service = new JwtService(mockSecret);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with valid secret', () => {
      const jwtService = new JwtService('valid-secret');
      
      expect(jwtService).toBeDefined();
      expect(jwtService.secret).toBe('valid-secret');
    });

    it('should throw error if secret is not provided', () => {
      expect(() => new JwtService('')).toThrow('JWT_SECRET is required');
    });

    it('should throw error if secret is null', () => {
      expect(() => new JwtService(null as any)).toThrow('JWT_SECRET is required');
    });

    it('should throw error if secret is undefined', () => {
      expect(() => new JwtService(undefined as any)).toThrow('JWT_SECRET is required');
    });

    it('should accept any string as secret', () => {
      const service1 = new JwtService('short');
      const service2 = new JwtService('a'.repeat(100));
      
      expect(service1.secret).toBe('short');
      expect(service2.secret).toBe('a'.repeat(100));
    });
  });

  describe('createToken', () => {
    const mockPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
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
          expiresIn: '15m',
          issuer: 'auth-service',
        })
      );
      expect(result).toBe(mockToken);
    });

    it('should create token for employee', async () => {
      const employeePayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario',
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
      const payloadWithoutName: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'client_uuid',
        cpf: '',
        user_type: 'cliente',
      };

      const mockToken = 'client.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await service.createToken(payloadWithoutName);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payloadWithoutName,
        mockSecret,
        expect.any(Object)
      );
    });

    it('should throw error if jwt.sign fails', async () => {
      const error = new Error('Signing failed');
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(service.createToken(mockPayload)).rejects.toThrow(
        'Failed to create JWT token: Signing failed'
      );
    });

    it('should handle non-Error exceptions', async () => {
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      await expect(service.createToken(mockPayload)).rejects.toThrow(
        'Failed to create JWT token: String error'
      );
    });

    it('should create token with empty cpf for anonymous client', async () => {
      const anonymousPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'temp_id',
        cpf: '',
        user_type: 'cliente',
      };

      const mockToken = 'anonymous.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await service.createToken(anonymousPayload);

      expect(result).toBe(mockToken);
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
      expect(result).toEqual(employeePayload);
    });

    it('should validate client token without CPF', async () => {
      const clientPayload: JwtPayload = {
        sub: 'client_uuid',
        cpf: '',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (jwt.verify as jest.Mock).mockReturnValue(clientPayload);

      const result = await service.validateToken(validToken);

      expect(result.cpf).toBe('');
      expect(result.user_type).toBe('cliente');
    });

    it('should throw error for expired token', async () => {
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow('Token expired');
    });

    it('should throw error for invalid token', async () => {
      const invalidError = new jwt.JsonWebTokenError('Invalid token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw invalidError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow('Invalid token');
    });

    it('should throw error for unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw unexpectedError;
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(
        'Token validation failed: Unexpected error'
      );
    });

    it('should handle non-Error exceptions during validation', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      await expect(service.validateToken(validToken)).rejects.toThrow(
        'Token validation failed: String error'
      );
    });

    it('should validate token without name', async () => {
      const payloadWithoutName: JwtPayload = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (jwt.verify as jest.Mock).mockReturnValue(payloadWithoutName);

      const result = await service.validateToken(validToken);

      expect(result.name).toBeUndefined();
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

    it('should decode employee token', () => {
      const employeePayload: JwtPayload = {
        ...mockDecodedPayload,
        user_type: 'funcionario',
      };

      (jwt.decode as jest.Mock).mockReturnValue(employeePayload);

      const result = service.decodeToken(validToken);

      expect(result?.user_type).toBe('funcionario');
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

    it('should decode token without name', () => {
      const payloadWithoutName: JwtPayload = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (jwt.decode as jest.Mock).mockReturnValue(payloadWithoutName);

      const result = service.decodeToken(validToken);

      expect(result?.name).toBeUndefined();
    });

    it('should handle any exception during decode', () => {
      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw 'Any error';
      });

      const result = service.decodeToken('bad.token');

      expect(result).toBeNull();
    });

    it('should decode token with empty cpf', () => {
      const payload: JwtPayload = {
        sub: 'temp_id',
        cpf: '',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (jwt.decode as jest.Mock).mockReturnValue(payload);

      const result = service.decodeToken(validToken);

      expect(result?.cpf).toBe('');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full token lifecycle', async () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente',
        name: 'Test User',
      };

      const mockToken = 'test.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = await service.createToken(payload);
      expect(token).toBe(mockToken);

      const decodedPayload: JwtPayload = {
        ...payload,
        iat: Date.now(),
        exp: Date.now() + 900,
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
      const validated = await service.validateToken(token);
      expect(validated.sub).toBe(payload.sub);

      (jwt.decode as jest.Mock).mockReturnValue(decodedPayload);
      const decoded = service.decodeToken(token);
      expect(decoded?.cpf).toBe(payload.cpf);
    });
  });
});
