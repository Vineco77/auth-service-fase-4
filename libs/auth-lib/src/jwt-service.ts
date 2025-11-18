import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export class JwtService {
  public secret: string;
  private readonly expiresIn = '15m';

  constructor(secret: string) {
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    this.secret = secret;
  }

  async createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    try {
      const options: jwt.SignOptions = {
        expiresIn: this.expiresIn,
        issuer: 'auth-service',
      };
      return jwt.sign(payload, this.secret as jwt.Secret, options);
    } catch (error) {
      throw new Error(`Failed to create JWT token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}