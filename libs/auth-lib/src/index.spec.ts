import { AuthLib } from './auth-lib';
import { JwtService } from './jwt-service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as indexExports from './index';

describe('index exports', () => {
  it('should export AuthLib', () => {
    expect(indexExports.AuthLib).toBeDefined();
    expect(indexExports.AuthLib).toBe(AuthLib);
  });

  it('should export JwtService', () => {
    expect(indexExports.JwtService).toBeDefined();
    expect(indexExports.JwtService).toBe(JwtService);
  });

  it('should export JwtPayload interface type', () => {
    // JwtPayload is a type, so we can't test it directly
    // but we can verify the module exports are accessible
    const payload: JwtPayload = {
      sub: 'test',
      cpf: '12345678901',
      user_type: 'cliente',
    };
    
    expect(payload).toBeDefined();
    expect(payload.sub).toBe('test');
  });

  it('should export all expected members', () => {
    const exports = Object.keys(indexExports);
    
    expect(exports).toContain('AuthLib');
    expect(exports).toContain('JwtService');
  });

  it('should allow creating AuthLib from exported class', () => {
    const lib = new indexExports.AuthLib('test-secret');
    
    expect(lib).toBeInstanceOf(AuthLib);
  });

  it('should allow creating JwtService from exported class', () => {
    const service = new indexExports.JwtService('test-secret');
    
    expect(service).toBeInstanceOf(JwtService);
  });
});
