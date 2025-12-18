import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { CreateEmployeeUseCase } from '../../../core/application/use-cases/create-employee.use-case';
import { DeleteEmployeeUseCase } from '../../../core/application/use-cases/delete-employee.use-case';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UserEntity } from '../../../core/domain/entities/user.entity';
import { AppError } from '../../../core/domain/errors/app.error';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let createEmployeeUseCase: jest.Mocked<CreateEmployeeUseCase>;
  let deleteEmployeeUseCase: jest.Mocked<DeleteEmployeeUseCase>;

  const mockCreateEmployeeUseCase = {
    execute: jest.fn(),
  };

  const mockDeleteEmployeeUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: CreateEmployeeUseCase,
          useValue: mockCreateEmployeeUseCase,
        },
        {
          provide: DeleteEmployeeUseCase,
          useValue: mockDeleteEmployeeUseCase,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    createEmployeeUseCase = module.get(CreateEmployeeUseCase);
    deleteEmployeeUseCase = module.get(DeleteEmployeeUseCase);

    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    const validSecretKey = 'valid-secret';

    it('should create employee successfully', async () => {
      const dto: CreateEmployeeDto = {
        cpf: '12345678901',
        name: 'John Doe',
      };

      const mockEmployee = new UserEntity(1, dto.cpf, dto.name);
      mockCreateEmployeeUseCase.execute.mockResolvedValue(mockEmployee);

      const result = await controller.createEmployee(dto, validSecretKey);

      expect(createEmployeeUseCase.execute).toHaveBeenCalledWith(
        dto.cpf,
        dto.name,
        validSecretKey
      );
      expect(result).toEqual({
        success: true,
        id: 1,
        message: 'Employee registered successfully',
        cpf: dto.cpf,
        name: dto.name,
      });
    });

    it('should throw forbidden error with invalid secret key', async () => {
      const dto: CreateEmployeeDto = {
        cpf: '12345678901',
        name: 'John Doe',
      };

      const error = AppError.forbidden({ message: 'Invalid admin secret key' });
      mockCreateEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createEmployee(dto, 'invalid-secret')
      ).rejects.toThrow(error);

      expect(createEmployeeUseCase.execute).toHaveBeenCalledWith(
        dto.cpf,
        dto.name,
        'invalid-secret'
      );
    });

    it('should throw conflict error if employee already exists', async () => {
      const dto: CreateEmployeeDto = {
        cpf: '12345678901',
        name: 'John Doe',
      };

      const error = AppError.conflict({
        message: 'Employee with this CPF already exists',
      });
      mockCreateEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createEmployee(dto, validSecretKey)
      ).rejects.toThrow(error);
    });

    it('should propagate internal server errors', async () => {
      const dto: CreateEmployeeDto = {
        cpf: '12345678901',
        name: 'John Doe',
      };

      const error = AppError.internal({ message: 'Database error' });
      mockCreateEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createEmployee(dto, validSecretKey)
      ).rejects.toThrow(error);
    });

    it('should handle employee creation with different names', async () => {
      const dto: CreateEmployeeDto = {
        cpf: '98765432109',
        name: 'Jane Smith',
      };

      const mockEmployee = new UserEntity(2, dto.cpf, dto.name);
      mockCreateEmployeeUseCase.execute.mockResolvedValue(mockEmployee);

      const result = await controller.createEmployee(dto, validSecretKey);

      expect(result.id).toBe(2);
      expect(result.name).toBe('Jane Smith');
    });
  });

  describe('deleteEmployee', () => {
    const validCpf = '12345678901';
    const validSecretKey = 'valid-secret';

    it('should delete employee successfully', async () => {
      mockDeleteEmployeeUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteEmployee(validCpf, validSecretKey);

      expect(deleteEmployeeUseCase.execute).toHaveBeenCalledWith(
        validCpf,
        validSecretKey
      );
      expect(result).toEqual({
        success: true,
        message: 'Employee deleted successfully',
      });
    });

    it('should throw forbidden error with invalid secret key', async () => {
      const error = AppError.forbidden({ message: 'Invalid admin secret key' });
      mockDeleteEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.deleteEmployee(validCpf, 'invalid-secret')
      ).rejects.toThrow(error);

      expect(deleteEmployeeUseCase.execute).toHaveBeenCalledWith(
        validCpf,
        'invalid-secret'
      );
    });

    it('should throw not found error if employee does not exist', async () => {
      const error = AppError.notFound({ message: 'Employee not found' });
      mockDeleteEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.deleteEmployee(validCpf, validSecretKey)
      ).rejects.toThrow(error);
    });

    it('should propagate internal server errors', async () => {
      const error = AppError.internal({ message: 'Database error' });
      mockDeleteEmployeeUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.deleteEmployee(validCpf, validSecretKey)
      ).rejects.toThrow(error);
    });

    it('should handle deletion with different CPFs', async () => {
      const anotherCpf = '98765432109';
      mockDeleteEmployeeUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteEmployee(anotherCpf, validSecretKey);

      expect(deleteEmployeeUseCase.execute).toHaveBeenCalledWith(
        anotherCpf,
        validSecretKey
      );
      expect(result.success).toBe(true);
    });
  });
});
