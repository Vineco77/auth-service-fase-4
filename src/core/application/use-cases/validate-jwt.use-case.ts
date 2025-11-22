import { Injectable, Inject } from '@nestjs/common';
import { JwtServiceInterface } from '../../domain/interfaces/jwt-service.interface';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

@Injectable()
export class ValidateJwtUseCase {
  constructor(
    @Inject('JwtServiceInterface')
    private readonly jwtService: JwtServiceInterface,
  ) {}

  async execute(token: string): Promise<JwtPayload> {
    return await this.jwtService.validateToken(token);
  }
}