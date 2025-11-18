import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { AppError } from '../../domain/errors/app.error';

@Injectable()
export class DeleteEmployeeUseCase {
  private readonly adminSecret: string;

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {
    this.adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!this.adminSecret) {
      throw new Error('ADMIN_SECRET_KEY is not defined');
    }
  }

  async execute(cpf: string, secretKey: string): Promise<void> {
    if (secretKey !== this.adminSecret) {
      throw AppError.forbidden({
        message: 'Invalid admin secret key',
      });
    }

    try {
      const existingEmployee = await this.userRepository.findByCpf(cpf);
      if (!existingEmployee) {
        throw AppError.notFound({
          message: 'Employee not found',
        });
      }

      await this.userRepository.deleteByCpf(cpf);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal({
        message: 'Failed to delete employee',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}