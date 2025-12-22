import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { AppError } from '../../domain/errors/app.error';

@Injectable()
export class CreateEmployeeUseCase {
  private readonly adminSecret: string;

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {
    this.adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!this.adminSecret) {
      throw new Error('ADMIN_SECRET_KEY is not defined..');
    }
  }

  async execute(cpf: string, name: string, secretKey: string): Promise<UserEntity> {
    if (secretKey !== this.adminSecret) {
      throw AppError.forbidden({
        message: 'Invalid admin secret key.',
      });
    }

    try {
      const existingEmployee = await this.userRepository.findByCpf(cpf);
      if (existingEmployee) {
        throw AppError.conflict({
          message: 'Employee with this CPF already exists.',
        });
      }

      const employee = UserEntity.create({ cpf, name });
      return await this.userRepository.create(employee);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal({
        message: 'Failed to create employee.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}