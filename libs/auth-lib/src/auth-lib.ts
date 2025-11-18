import { JwtService } from './jwt-service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export class AuthLib {
  private jwtService: JwtService;

  constructor(jwtSecret: string) {
    this.jwtService = new JwtService(jwtSecret);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    return await this.jwtService.validateToken(token);
  }

  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decodeToken(token);
  }

  // Método opcional para criar tokens (se outros serviços precisarem)
  async createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return await this.jwtService.createToken(payload);
  }
}