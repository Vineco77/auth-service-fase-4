import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtServiceInterface } from '../../../core/domain/interfaces/jwt-service.interface';
import { JwtPayload } from '../../../core/domain/interfaces/jwt-payload.interface';
import { AppError } from '../../../core/domain/errors/app.error';

@Injectable()
export class JwtService implements JwtServiceInterface {
  private readonly secret: string;
  private readonly expiresIn: jwt.SignOptions['expiresIn'] = '30d'; // 15 minutos conforme regra

  constructor() {
    this.secret = process.env.JWT_SECRET;
    if (!this.secret) {
      throw new Error('JWT_SECRET is not defined');
    }
  }

  async createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    try {
      const options: jwt.SignOptions = {
        expiresIn: this.expiresIn,
        issuer: 'auth-service',
      };
      return jwt.sign(payload, this.secret as jwt.Secret, options);
    } catch (error) {
      throw AppError.internal({
        message: 'Failed to create JWT token',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized({
          message: 'Token expired',
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized({
          message: 'Invalid token',
        });
      }
      throw AppError.internal({
        message: 'Token validation failed',
        details: error instanceof Error ? error.message : String(error),
      });
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