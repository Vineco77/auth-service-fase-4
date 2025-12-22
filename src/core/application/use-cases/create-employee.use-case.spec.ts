import { Test, TestingModule } from '@nestjs/testing';
import { CreateEmployeeUseCase } from './create-employee.use-case';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { AppError } from '../../domain/errors/app.error';

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase;
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
        CreateEmployeeUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateEmployeeUseCase>(CreateEmployeeUseCase);
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
        new CreateEmployeeUseCase(mockUserRepository);
      }).toThrow('ADMIN_SECRET_KEY is not defined');
    });
  });

  describe('execute', () => {
    const validCpf = '12345678901';
    const validName = 'John Doe';
    const validSecretKey = 'test-secret-key';

    it('should create employee successfully', async () => {
      const expectedEmployee = new UserEntity(1, validCpf, validName);
      
      userRepository.findByCpf.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(expectedEmployee);

      const result = await useCase.execute(validCpf, validName, validSecretKey);

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toEqual(expectedEmployee);
    });

    it('should throw forbidden error if secret key is invalid', async () => {
      const invalidSecretKey = 'wrong-secret';

      await expect(
        useCase.execute(validCpf, validName, invalidSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, validName, invalidSecretKey)
      ).rejects.toMatchObject({
        errorType: 'ForbiddenError',
      });

      expect(userRepository.findByCpf).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw conflict error if employee already exists', async () => {
      const existingEmployee = new UserEntity(1, validCpf, validName);
      
      userRepository.findByCpf.mockResolvedValue(existingEmployee);

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toMatchObject({
        errorType: 'ConflictError',
      });

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw internal error if repository create fails', async () => {
      userRepository.findByCpf.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toThrow(AppError);

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toMatchObject({
        errorType: 'InternalServerError',
      });
    });

    it('should rethrow AppError if repository throws AppError', async () => {
      const customError = AppError.badRequest({ message: 'Custom error' });
      
      userRepository.findByCpf.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(customError);

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toThrow(customError);

      expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
    });

    it('should handle non-Error exceptions', async () => {
      userRepository.findByCpf.mockResolvedValue(null);
      userRepository.create.mockRejectedValue('String error');

      await expect(
        useCase.execute(validCpf, validName, validSecretKey)
      ).rejects.toThrow(AppError);
    });

  });
});
