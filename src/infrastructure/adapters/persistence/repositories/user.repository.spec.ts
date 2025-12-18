import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../../config/database/prisma/prisma.service';
import { UserEntity } from '../../../../core/domain/entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const userEntity = UserEntity.create({
        cpf: '12345678901',
        name: 'John Doe',
      });

      const mockPrismaUser = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
      };

      mockPrismaService.user.create.mockResolvedValue(mockPrismaUser);

      const result = await repository.create(userEntity);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          cpf: '12345678901',
          name: 'John Doe',
        },
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe(1);
      expect(result.cpf).toBe('12345678901');
      expect(result.name).toBe('John Doe');
    });

    it('should create a user with existing id', async () => {
      const userEntity = new UserEntity(99, '98765432109', 'Jane Doe');

      const mockPrismaUser = {
        id: 99,
        cpf: '98765432109',
        name: 'Jane Doe',
      };

      mockPrismaService.user.create.mockResolvedValue(mockPrismaUser);

      const result = await repository.create(userEntity);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          cpf: '98765432109',
          name: 'Jane Doe',
          id: 99,
        },
      });
      expect(result.id).toBe(99);
    });

    it('should propagate database errors', async () => {
      const userEntity = UserEntity.create({
        cpf: '12345678901',
        name: 'John Doe',
      });

      const error = new Error('Database connection failed');
      mockPrismaService.user.create.mockRejectedValue(error);

      await expect(repository.create(userEntity)).rejects.toThrow(error);
    });
  });

  describe('findByCpf', () => {
    it('should find a user by CPF', async () => {
      const mockPrismaUser = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockPrismaUser);

      const result = await repository.findByCpf('12345678901');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf: '12345678901' },
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.cpf).toBe('12345678901');
      expect(result?.name).toBe('John Doe');
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByCpf('99999999999');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { cpf: '99999999999' },
      });
      expect(result).toBeNull();
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database query failed');
      mockPrismaService.user.findUnique.mockRejectedValue(error);

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(error);
    });
  });

  describe('deleteByCpf', () => {
    it('should delete a user by CPF', async () => {
      const mockPrismaUser = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
      };

      mockPrismaService.user.delete.mockResolvedValue(mockPrismaUser);

      await repository.deleteByCpf('12345678901');

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { cpf: '12345678901' },
      });
    });

    it('should propagate not found errors', async () => {
      const error = new Error('Record not found');
      mockPrismaService.user.delete.mockRejectedValue(error);

      await expect(repository.deleteByCpf('99999999999')).rejects.toThrow(error);
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection lost');
      mockPrismaService.user.delete.mockRejectedValue(error);

      await expect(repository.deleteByCpf('12345678901')).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockPrismaUsers = [
        { id: 1, cpf: '12345678901', name: 'John Doe' },
        { id: 2, cpf: '98765432109', name: 'Jane Smith' },
        { id: 3, cpf: '11111111111', name: 'Bob Johnson' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockPrismaUsers);

      const result = await repository.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(UserEntity);
      expect(result[0].cpf).toBe('12345678901');
      expect(result[1].cpf).toBe('98765432109');
      expect(result[2].cpf).toBe('11111111111');
    });

    it('should return empty array if no users found', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database query failed');
      mockPrismaService.user.findMany.mockRejectedValue(error);

      await expect(repository.findAll()).rejects.toThrow(error);
    });
  });
});
