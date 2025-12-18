import { Test, TestingModule } from '@nestjs/testing';
import { ValidateJwtUseCase } from './validate-jwt.use-case';
import { JwtServiceInterface } from '../../domain/interfaces/jwt-service.interface';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

describe('ValidateJwtUseCase', () => {
  let useCase: ValidateJwtUseCase;
  let jwtService: jest.Mocked<JwtServiceInterface>;

  const mockJwtService = {
    createToken: jest.fn(),
    validateToken: jest.fn(),
    decodeToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateJwtUseCase,
        {
          provide: 'JwtServiceInterface',
          useValue: mockJwtService,
        },
      ],
    }).compile();

    useCase = module.get<ValidateJwtUseCase>(ValidateJwtUseCase);
    jwtService = module.get('JwtServiceInterface');

    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validToken = 'valid.jwt.token';
    const mockPayload: JwtPayload = {
      sub: '12345678901',
      cpf: '12345678901',
      user_type: 'cliente',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    it('should validate token successfully and return payload', async () => {
      jwtService.validateToken.mockResolvedValue(mockPayload);

      const result = await useCase.execute(validToken);

      expect(jwtService.validateToken).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockPayload);
    });

    it('should throw error if token is invalid', async () => {
      const error = new Error('Invalid token');
      jwtService.validateToken.mockRejectedValue(error);

      await expect(useCase.execute(validToken)).rejects.toThrow(error);
      expect(jwtService.validateToken).toHaveBeenCalledWith(validToken);
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

      jwtService.validateToken.mockResolvedValue(employeePayload);

      const result = await useCase.execute(validToken);

      expect(result).toEqual(employeePayload);
      expect(result.user_type).toBe('funcionario');
    });

    it('should validate client token without CPF', async () => {
      const clientPayload: JwtPayload = {
        sub: 'client_uuid-here',
        cpf: '',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      jwtService.validateToken.mockResolvedValue(clientPayload);

      const result = await useCase.execute(validToken);

      expect(result).toEqual(clientPayload);
      expect(result.cpf).toBe('');
    });
  });
});
