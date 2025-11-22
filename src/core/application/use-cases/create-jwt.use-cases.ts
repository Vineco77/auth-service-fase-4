// src/core/application/use-cases/create-jwt.use-cases.ts
import { Injectable, Inject } from '@nestjs/common';
import { JwtServiceInterface } from '../../domain/interfaces/jwt-service.interface';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';
import { UserRepositoryInterface } from '../ports/output/repositories/user.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../domain/errors/app.error';

@Injectable()
export class CreateJwtUseCase {
  constructor(
    @Inject('JwtServiceInterface')
    private readonly jwtService: JwtServiceInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(cpf?: string, name?: string): Promise<{ token: string }> {
    // LÓGICA PRINCIPAL: Se CPF não for enviado ou for vazio → cliente
    if (!cpf || cpf.trim() === '') {
      return this.generateClientToken(name);
    }

    if (!this.isValidCpfFormat(cpf)) {
      throw AppError.badRequest({
        message: 'Invalid CPF format. CPF must have exactly 11 numeric digits',
        details: `Received: ${cpf}`
      });
    }

    const employee = await this.userRepository.findByCpf(cpf);
    
    const userType = employee ? 'funcionario' : 'cliente';
    
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: cpf, 
      cpf,
      user_type: userType,
      ...(name && { name }),
    };

    const token = await this.jwtService.createToken(payload);
    
    return { token };
  }

  private async generateClientToken(name?: string): Promise<{ token: string }> {
    const temporaryId = `client_${uuidv4()}`;
    
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: temporaryId, 
      cpf: '', 
      user_type: 'cliente',
      ...(name && { name }),
    };

    const token = await this.jwtService.createToken(payload);
    
    return { token };
  }

  private isValidCpfFormat(cpf: string): boolean {
    return /^\d{11}$/.test(cpf);
  }
}