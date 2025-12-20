import { AuthLib } from './auth-lib';
import { JwtService } from './jwt-service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

jest.mock('./jwt-service');

describe('AuthLib', () => {
  let authLib: AuthLib;
  let mockJwtService: jest.Mocked<JwtService>;
  const mockSecret = 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    authLib = new AuthLib(mockSecret);
    mockJwtService = (authLib as any).jwtService;
  });

  describe('constructor', () => {
    it('should create AuthLib instance with valid secret', () => {
      const lib = new AuthLib('valid-secret');
      
      expect(lib).toBeDefined();
      expect(JwtService).toHaveBeenCalledWith('valid-secret');
    });

    it('should initialize JwtService with provided secret', () => {
      expect(JwtService).toHaveBeenCalledWith(mockSecret);
    });

    it('should create instance with different secrets', () => {
      const lib1 = new AuthLib('secret1');
      const lib2 = new AuthLib('secret2');
      
      expect(lib1).toBeDefined();
      expect(lib2).toBeDefined();
    });
  });

  describe('validateToken', () => {
    const validToken = 'valid.jwt.token';
    const mockPayload: JwtPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should validate token successfully', async () => {
      mockJwtService.validateToken = jest.fn().mockResolvedValue(mockPayload);

      const result = await authLib.validateToken(validToken);

      expect(mockJwtService.validateToken).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockPayload);
    });

    it('should validate employee token', async () => {
      const employeePayload: JwtPayload = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario',
        name: 'Jane Employee',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.validateToken = jest.fn().mockResolvedValue(employeePayload);

      const result = await authLib.validateToken(validToken);

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

      mockJwtService.validateToken = jest.fn().mockResolvedValue(clientPayload);

      const result = await authLib.validateToken(validToken);

      expect(result.cpf).toBe('');
      expect(result.user_type).toBe('cliente');
    });

    it('should propagate validation errors', async () => {
      const error = new Error('Invalid token');
      mockJwtService.validateToken = jest.fn().mockRejectedValue(error);

      await expect(authLib.validateToken(validToken)).rejects.toThrow(error);
      expect(mockJwtService.validateToken).toHaveBeenCalledWith(validToken);
    });

    it('should handle expired token errors', async () => {
      const error = new Error('Token expired');
      mockJwtService.validateToken = jest.fn().mockRejectedValue(error);

      await expect(authLib.validateToken(validToken)).rejects.toThrow('Token expired');
    });

    it('should validate token without name', async () => {
      const payloadWithoutName: JwtPayload = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.validateToken = jest.fn().mockResolvedValue(payloadWithoutName);

      const result = await authLib.validateToken(validToken);

      expect(result.name).toBeUndefined();
    });
  });

  describe('decodeToken', () => {
    const validToken = 'valid.jwt.token';
    const mockPayload: JwtPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should decode token successfully', () => {
      mockJwtService.decodeToken = jest.fn().mockReturnValue(mockPayload);

      const result = authLib.decodeToken(validToken);

      expect(mockJwtService.decodeToken).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockPayload);
    });

    it('should decode employee token', () => {
      const employeePayload: JwtPayload = {
        ...mockPayload,
        user_type: 'funcionario',
      };

      mockJwtService.decodeToken = jest.fn().mockReturnValue(employeePayload);

      const result = authLib.decodeToken(validToken);

      expect(result?.user_type).toBe('funcionario');
    });

    it('should return null for invalid token', () => {
      mockJwtService.decodeToken = jest.fn().mockReturnValue(null);

      const result = authLib.decodeToken('invalid.token');

      expect(mockJwtService.decodeToken).toHaveBeenCalledWith('invalid.token');
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      mockJwtService.decodeToken = jest.fn().mockReturnValue(null);

      const result = authLib.decodeToken('malformed');

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

      mockJwtService.decodeToken = jest.fn().mockReturnValue(payloadWithoutName);

      const result = authLib.decodeToken(validToken);

      expect(result?.name).toBeUndefined();
    });

    it('should decode token with empty cpf', () => {
      const payload: JwtPayload = {
        sub: 'temp_id',
        cpf: '',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.decodeToken = jest.fn().mockReturnValue(payload);

      const result = authLib.decodeToken(validToken);

      expect(result?.cpf).toBe('');
    });
  });

  describe('createToken', () => {
    const mockPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
    };

    it('should create token successfully', async () => {
      const mockToken = 'generated.jwt.token';
      mockJwtService.createToken = jest.fn().mockResolvedValue(mockToken);

      const result = await authLib.createToken(mockPayload);

      expect(mockJwtService.createToken).toHaveBeenCalledWith(mockPayload);
      expect(result).toBe(mockToken);
    });

    it('should create employee token', async () => {
      const employeePayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario',
        name: 'Jane Employee',
      };

      const mockToken = 'employee.jwt.token';
      mockJwtService.createToken = jest.fn().mockResolvedValue(mockToken);

      const result = await authLib.createToken(employeePayload);

      expect(result).toBe(mockToken);
      expect(mockJwtService.createToken).toHaveBeenCalledWith(employeePayload);
    });

    it('should create client token without name', async () => {
      const clientPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'client_uuid',
        cpf: '',
        user_type: 'cliente',
      };

      const mockToken = 'client.jwt.token';
      mockJwtService.createToken = jest.fn().mockResolvedValue(mockToken);

      const result = await authLib.createToken(clientPayload);

      expect(result).toBe(mockToken);
      expect(mockJwtService.createToken).toHaveBeenCalledWith(clientPayload);
    });

    it('should propagate creation errors', async () => {
      const error = new Error('Failed to create token');
      mockJwtService.createToken = jest.fn().mockRejectedValue(error);

      await expect(authLib.createToken(mockPayload)).rejects.toThrow(error);
      expect(mockJwtService.createToken).toHaveBeenCalledWith(mockPayload);
    });

    it('should create token with empty cpf', async () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'temp_id',
        cpf: '',
        user_type: 'cliente',
      };

      const mockToken = 'temp.token';
      mockJwtService.createToken = jest.fn().mockResolvedValue(mockToken);

      const result = await authLib.createToken(payload);

      expect(result).toBe(mockToken);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete auth workflow', async () => {
      const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente',
        name: 'Test User',
      };

      const mockToken = 'test.token';
      mockJwtService.createToken = jest.fn().mockResolvedValue(mockToken);

      const token = await authLib.createToken(payload);
      expect(token).toBe(mockToken);

      const fullPayload: JwtPayload = {
        ...payload,
        iat: Date.now(),
        exp: Date.now() + 900,
      };

      mockJwtService.validateToken = jest.fn().mockResolvedValue(fullPayload);
      const validated = await authLib.validateToken(token);
      expect(validated.sub).toBe(payload.sub);

      mockJwtService.decodeToken = jest.fn().mockReturnValue(fullPayload);
      const decoded = authLib.decodeToken(token);
      expect(decoded?.cpf).toBe(payload.cpf);
    });

    it('should handle multiple token operations', async () => {
      const clientPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'client_id',
        cpf: '',
        user_type: 'cliente',
      };

      const employeePayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: 'employee_id',
        cpf: '12345678901',
        user_type: 'funcionario',
        name: 'Employee',
      };

      mockJwtService.createToken = jest.fn()
        .mockResolvedValueOnce('client.token')
        .mockResolvedValueOnce('employee.token');

      const clientToken = await authLib.createToken(clientPayload);
      const employeeToken = await authLib.createToken(employeePayload);

      expect(clientToken).toBe('client.token');
      expect(employeeToken).toBe('employee.token');
    });
  });
});
