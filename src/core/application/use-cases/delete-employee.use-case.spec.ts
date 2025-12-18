import { Test, TestingModule } from '@nestjs/testing';
import { DeleteEmployeeUseCase } from './delete-employee.use-case';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { AppError } from '../../domain/errors/app.error';

describe('DeleteEmployeeUseCase', () => {
  let useCase: DeleteEmployeeUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  const mockUserRepository = {
    create: jest.fn(),
    findByCpf: jest.fn(),
    deleteByCpf: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    process.env.ADMIN_SECRET_KEY = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteEmployeeUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteEmployeeUseCase>(DeleteEmployeeUseCase);
    userRepository = module.get('UserRepositoryInterface');

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET_KEY;
  });

  describe('constructor', () => {
    it('should throw error if ADMIN_SECRET_KEY is not defined', () => {
      delete process.env.ADMIN_SECRET_KEY;
      
      expect(() => {
        new DeleteEmployeeUseCase(mockUserRepository);
      }).toThrow('ADMIN_SECRET_KEY is not defined');
    });
  });

  describe('execute', () => {
    const validCpf = '12345678901';
    const validSecretKey = 'test-secret-key';

    it('should delete employee successfully', async () => {
      const existingEmployee = new UserEntity(1, validCpf, 'John Doe');
      
      userRepository.findByCpf.mockResolvedValue(existingEmployee);
      userRepository.deleteByCpf.mockResolvedValue(undefined);

      await useCase.execute(validCpf, validSecretKey);

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
      expect(userRepository.deleteByCpf).toHaveBeenCalledWith(validCpf);
    });

    it('should throw forbidden error if secret key is invalid', async () => {
      const invalidSecretKey = 'wrong-secret';

      await expect(
        useCase.execute(validCpf, invalidSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, invalidSecretKey)
      ).rejects.toMatchObject({
        errorType: 'ForbiddenError',
      });

      expect(userRepository.findByCpf).not.toHaveBeenCalled();
      expect(userRepository.deleteByCpf).not.toHaveBeenCalled();
    });

    it('should throw not found error if employee does not exist', async () => {
      userRepository.findByCpf.mockResolvedValue(null);

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toMatchObject({
        errorType: 'NotFoundError',
      });

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
      expect(userRepository.deleteByCpf).not.toHaveBeenCalled();
    });

    it('should throw internal error if repository delete fails', async () => {
      const existingEmployee = new UserEntity(1, validCpf, 'John Doe');
      
      userRepository.findByCpf.mockResolvedValue(existingEmployee);
      userRepository.deleteByCpf.mockRejectedValue(new Error('Database error'));

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toMatchObject({
        errorType: 'InternalServerError',
      });
    });

    it('should rethrow AppError if repository throws AppError', async () => {
      const customError = AppError.badRequest({ message: 'Custom error' });
      const existingEmployee = new UserEntity(1, validCpf, 'John Doe');
      
      userRepository.findByCpf.mockResolvedValue(existingEmployee);
      userRepository.deleteByCpf.mockRejectedValue(customError);

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toThrow(customError);

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
    });

    it('should handle non-Error exceptions', async () => {
      const existingEmployee = new UserEntity(1, validCpf, 'John Doe');
      
      userRepository.findByCpf.mockResolvedValue(existingEmployee);
      userRepository.deleteByCpf.mockRejectedValue('String error');

      await expect(
        useCase.execute(validCpf, validSecretKey)
      ).rejects.toThrow(AppError);
    });
  });
});
