import { Test, TestingModule } from '@nestjs/testing';
import { CreateJwtUseCase } from './create-jwt.use-cases';
import { JwtServiceInterface } from '../../domain/interfaces/jwt-service.interface';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { AppError } from '../../domain/errors/app.error';

describe('CreateJwtUseCase', () => {
  let useCase: CreateJwtUseCase;
  let jwtService: jest.Mocked<JwtServiceInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  const mockJwtService = {
    createToken: jest.fn(),
    validateToken: jest.fn(),
    decodeToken: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    findByCpf: jest.fn(),
    deleteByCpf: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateJwtUseCase,
        {
          provide: 'JwtServiceInterface',
          useValue: mockJwtService,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateJwtUseCase>(CreateJwtUseCase);
    jwtService = module.get('JwtServiceInterface');
    userRepository = module.get('UserRepositoryInterface');

    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validToken = 'valid.jwt.token';

    describe('cliente (client) flow', () => {
      it('should generate client token when CPF is not provided', async () => {
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute(undefined, 'John Doe');

        expect(result).toEqual({ token: validToken });
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: expect.stringContaining('client_'),
            cpf: '',
            user_type: 'cliente',
            name: 'John Doe',
          })
        );
        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should generate client token when CPF is empty string', async () => {
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute('', 'Jane Doe');

        expect(result).toEqual({ token: validToken });
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: expect.stringContaining('client_'),
            cpf: '',
            user_type: 'cliente',
            name: 'Jane Doe',
          })
        );
        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should generate client token when CPF is whitespace', async () => {
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute('   ', undefined);

        expect(result).toEqual({ token: validToken });
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: expect.stringContaining('client_'),
            cpf: '',
            user_type: 'cliente',
          })
        );
        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should generate client token without name when name is not provided', async () => {
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute(undefined, undefined);

        expect(result).toEqual({ token: validToken });
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.not.objectContaining({
            name: expect.anything(),
          })
        );
      });
    });

    describe('funcionario (employee) flow', () => {
      const validCpf = '12345678901';

      it('should generate employee token when employee exists', async () => {
        const employee = new UserEntity(1, validCpf, 'Employee Name');
        userRepository.findByCpf.mockResolvedValue(employee);
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute(validCpf, 'Employee Name');

        expect(result).toEqual({ token: validToken });
        expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: validCpf,
            cpf: validCpf,
            user_type: 'funcionario',
            name: 'Employee Name',
          })
        );
      });

      it('should generate client token with CPF when employee does not exist', async () => {
        userRepository.findByCpf.mockResolvedValue(null);
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute(validCpf, 'Client Name');

        expect(result).toEqual({ token: validToken });
        expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: validCpf,
            cpf: validCpf,
            user_type: 'cliente',
            name: 'Client Name',
          })
        );
      });

      it('should generate token without name when name is not provided', async () => {
        userRepository.findByCpf.mockResolvedValue(null);
        jwtService.createToken.mockResolvedValue(validToken);

        const result = await useCase.execute(validCpf, undefined);

        expect(result).toEqual({ token: validToken });
        expect(jwtService.createToken).toHaveBeenCalledWith(
          expect.not.objectContaining({
            name: expect.anything(),
          })
        );
      });
    });

    describe('CPF validation', () => {
      it('should throw bad request error for invalid CPF format (less than 11 digits)', async () => {
        const invalidCpf = '123456789';

        await expect(
          useCase.execute(invalidCpf, 'Name')
        ).rejects.toThrow(AppError);

        await expect(
          useCase.execute(invalidCpf, 'Name')
        ).rejects.toMatchObject({
          errorType: 'BadRequestError',
        });

        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should throw bad request error for invalid CPF format (more than 11 digits)', async () => {
        const invalidCpf = '123456789012';

        await expect(
          useCase.execute(invalidCpf, 'Name')
        ).rejects.toThrow(AppError);

        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should throw bad request error for CPF with letters', async () => {
        const invalidCpf = '1234567890a';

        await expect(
          useCase.execute(invalidCpf, 'Name')
        ).rejects.toThrow(AppError);

        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should throw bad request error for CPF with special characters', async () => {
        const invalidCpf = '123.456.789-01';

        await expect(
          useCase.execute(invalidCpf, 'Name')
        ).rejects.toThrow(AppError);

        expect(userRepository.findByCpf).not.toHaveBeenCalled();
      });

      it('should accept valid CPF with 11 digits', async () => {
        const validCpf = '12345678901';
        userRepository.findByCpf.mockResolvedValue(null);
        jwtService.createToken.mockResolvedValue('token');

        await useCase.execute(validCpf, 'Name');

        expect(userRepository.findByCpf).toHaveBeenCalledWith(validCpf);
      });
    });
  });
});
