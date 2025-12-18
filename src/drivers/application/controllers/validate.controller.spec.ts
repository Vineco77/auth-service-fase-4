import { Test, TestingModule } from '@nestjs/testing';
import { ValidateController } from './validate.controller';
import { ValidateJwtUseCase } from '../../../core/application/use-cases/validate-jwt.use-case';
import { ValidateJwtDto } from '../dtos/validate-jwt.dto';
import { JwtPayload } from '../../../../libs/auth-lib/src/interfaces/jwt-payload.interface';
import { AppError } from '../../../core/domain/errors/app.error';

describe('ValidateController', () => {
  let controller: ValidateController;
  let validateJwtUseCase: jest.Mocked<ValidateJwtUseCase>;

  const mockValidateJwtUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidateController],
      providers: [
        {
          provide: ValidateJwtUseCase,
          useValue: mockValidateJwtUseCase,
        },
      ],
    }).compile();

    controller = module.get<ValidateController>(ValidateController);
    validateJwtUseCase = module.get(ValidateJwtUseCase);

    jest.clearAllMocks();
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

    it('should validate token successfully and return payload', async () => {
      const dto: ValidateJwtDto = { token: validToken };
      
      mockValidateJwtUseCase.execute.mockResolvedValue(mockPayload);

      const result = await controller.validateToken(dto);

      expect(validateJwtUseCase.execute).toHaveBeenCalledWith(validToken);
      expect(result).toEqual({
        success: true,
        valid: true,
        payload: mockPayload,
      });
    });

    it('should return valid false when token validation fails', async () => {
      const dto: ValidateJwtDto = { token: 'invalid.token' };
      
      const error = AppError.unauthorized({ message: 'Invalid token' });
      mockValidateJwtUseCase.execute.mockRejectedValue(error);

      const result = await controller.validateToken(dto);

      expect(validateJwtUseCase.execute).toHaveBeenCalledWith('invalid.token');
      expect(result).toEqual({
        success: false,
        valid: false,
      });
    });

    it('should return valid false when token is expired', async () => {
      const dto: ValidateJwtDto = { token: 'expired.token' };
      
      const error = AppError.unauthorized({ message: 'Token expired' });
      mockValidateJwtUseCase.execute.mockRejectedValue(error);

      const result = await controller.validateToken(dto);

      expect(result).toEqual({
        success: false,
        valid: false,
      });
    });

    it('should validate employee token successfully', async () => {
      const employeePayload: JwtPayload = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario',
        name: 'Jane Employee',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const dto: ValidateJwtDto = { token: validToken };
      
      mockValidateJwtUseCase.execute.mockResolvedValue(employeePayload);

      const result = await controller.validateToken(dto);

      expect(result).toEqual({
        success: true,
        valid: true,
        payload: employeePayload,
      });
      expect(result.payload?.user_type).toBe('funcionario');
    });

    it('should validate client token without CPF', async () => {
      const clientPayload: JwtPayload = {
        sub: 'client_uuid',
        cpf: '',
        user_type: 'cliente',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const dto: ValidateJwtDto = { token: validToken };
      
      mockValidateJwtUseCase.execute.mockResolvedValue(clientPayload);

      const result = await controller.validateToken(dto);

      expect(result).toEqual({
        success: true,
        valid: true,
        payload: clientPayload,
      });
      expect(result.payload?.cpf).toBe('');
    });

    it('should catch and handle any error type', async () => {
      const dto: ValidateJwtDto = { token: validToken };
      
      mockValidateJwtUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      const result = await controller.validateToken(dto);

      expect(result).toEqual({
        success: false,
        valid: false,
      });
    });

    it('should not include payload when validation fails', async () => {
      const dto: ValidateJwtDto = { token: 'bad.token' };
      
      mockValidateJwtUseCase.execute.mockRejectedValue(
        AppError.unauthorized({ message: 'Invalid token' })
      );

      const result = await controller.validateToken(dto);

      expect(result.payload).toBeUndefined();
      expect(result.valid).toBe(false);
    });
  });
});
