import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { CreateJwtUseCase } from '../../../core/application/use-cases/create-jwt.use-cases';
import { CreateJwtDto } from '../dtos/create-jwt.dto';
import { AppError } from '../../../core/domain/errors/app.error';

describe('AuthController', () => {
  let controller: AuthController;
  let createJwtUseCase: jest.Mocked<CreateJwtUseCase>;

  const mockCreateJwtUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: CreateJwtUseCase,
          useValue: mockCreateJwtUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    createJwtUseCase = module.get(CreateJwtUseCase);

    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create token successfully for client without CPF', async () => {
      const dto: CreateJwtDto = {
        name: 'John Doe',
      };

      const mockToken = 'generated.jwt.token';
      mockCreateJwtUseCase.execute.mockResolvedValue({ token: mockToken });

      const result = await controller.createToken(dto);

      expect(createJwtUseCase.execute).toHaveBeenCalledWith(undefined, 'John Doe');
      expect(result).toEqual({
        success: true,
        token: mockToken,
        message: 'Token created successfully',
      });
    });

    it('should create token successfully with CPF', async () => {
      const dto: CreateJwtDto = {
        cpf: '12345678901',
        name: 'Jane Doe',
      };

      const mockToken = 'generated.jwt.token';
      mockCreateJwtUseCase.execute.mockResolvedValue({ token: mockToken });

      const result = await controller.createToken(dto);

      expect(createJwtUseCase.execute).toHaveBeenCalledWith('12345678901', 'Jane Doe');
      expect(result).toEqual({
        success: true,
        token: mockToken,
        message: 'Token created successfully',
      });
    });

    it('should create token without name', async () => {
      const dto: CreateJwtDto = {
        cpf: '12345678901',
      };

      const mockToken = 'generated.jwt.token';
      mockCreateJwtUseCase.execute.mockResolvedValue({ token: mockToken });

      const result = await controller.createToken(dto);

      expect(createJwtUseCase.execute).toHaveBeenCalledWith('12345678901', undefined);
      expect(result).toEqual({
        success: true,
        token: mockToken,
        message: 'Token created successfully',
      });
    });

    it('should throw error if use case fails with invalid CPF', async () => {
      const dto: CreateJwtDto = {
        cpf: 'invalid-cpf',
        name: 'Test User',
      };

      const error = AppError.badRequest({ message: 'Invalid CPF format' });
      mockCreateJwtUseCase.execute.mockRejectedValue(error);

      await expect(controller.createToken(dto)).rejects.toThrow(error);
      expect(createJwtUseCase.execute).toHaveBeenCalledWith('invalid-cpf', 'Test User');
    });

    it('should propagate internal server errors', async () => {
      const dto: CreateJwtDto = {
        cpf: '12345678901',
      };

      const error = AppError.internal({ message: 'Database connection failed' });
      mockCreateJwtUseCase.execute.mockRejectedValue(error);

      await expect(controller.createToken(dto)).rejects.toThrow(error);
    });

    it('should handle empty DTO', async () => {
      const dto: CreateJwtDto = {};

      const mockToken = 'generated.jwt.token';
      mockCreateJwtUseCase.execute.mockResolvedValue({ token: mockToken });

      const result = await controller.createToken(dto);

      expect(createJwtUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
      expect(result.success).toBe(true);
    });
  });
});
