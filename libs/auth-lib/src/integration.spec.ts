import { AuthLib } from './auth-lib';
import { JwtService } from './jwt-service';

describe('Auth-Lib Integration Tests', () => {
  const testSecret = 'integration-test-secret-key';
  let authLib: AuthLib;
  let jwtService: JwtService;

  beforeEach(() => {
    authLib = new AuthLib(testSecret);
    jwtService = new JwtService(testSecret);
  });

  describe('Cliente (Customer) Flow', () => {
    it('should handle complete customer authentication flow without CPF', async () => {
      const customerPayload = {
        sub: 'temp_customer_123',
        cpf: '',
        user_type: 'cliente' as const,
        name: 'João Silva',
      };

      const token = await jwtService.createToken(customerPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.user_type).toBe('cliente');
      expect(decoded?.cpf).toBe('');
      expect(decoded?.name).toBe('João Silva');
    });

    it('should handle customer with CPF', async () => {
      const customerPayload = {
        sub: '12345678901',
        cpf: '12345678901',
        user_type: 'cliente' as const,
        name: 'Maria Santos',
      };

      const token = await jwtService.createToken(customerPayload);
      
      const decoded = jwtService.decodeToken(token);
      expect(decoded?.cpf).toBe('12345678901');
      expect(decoded?.user_type).toBe('cliente');
    });
  });

  describe('Funcionário (Employee) Flow', () => {
    it('should handle complete employee authentication flow', async () => {
      const employeePayload = {
        sub: '98765432109',
        cpf: '98765432109',
        user_type: 'funcionario' as const,
        name: 'Carlos Funcionário',
      };

      const token = await jwtService.createToken(employeePayload);
      expect(token).toBeDefined();

      const decoded = jwtService.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.user_type).toBe('funcionario');
      expect(decoded?.cpf).toBe('98765432109');
      expect(decoded?.name).toBe('Carlos Funcionário');
    });
  });

  describe('Multi-Service Token Sharing', () => {
    it('should allow token created by one service to be validated by another', async () => {
      const authLib1 = new AuthLib(testSecret);
      const authLib2 = new AuthLib(testSecret);

      const payload = {
        sub: '11111111111',
        cpf: '11111111111',
        user_type: 'cliente' as const,
        name: 'Shared User',
      };

      const token = await authLib1.createToken(payload);
      
      const decoded1 = authLib1.decodeToken(token);
      const decoded2 = authLib2.decodeToken(token);

      expect(decoded1).toEqual(decoded2);
      expect(decoded1?.sub).toBe('11111111111');
    });

    it('should fail validation with different secrets', async () => {
      const authLib1 = new AuthLib('secret1');
      const authLib2 = new AuthLib('secret2');

      const payload = {
        sub: '22222222222',
        cpf: '22222222222',
        user_type: 'cliente' as const,
      };

      const token = await authLib1.createToken(payload);

      await expect(authLib2.validateToken(token)).rejects.toThrow('Invalid token');
    });
  });

  describe('Token Lifecycle', () => {
    it('should create, decode, and store token metadata', async () => {
      const payload = {
        sub: '33333333333',
        cpf: '33333333333',
        user_type: 'funcionario' as const,
        name: 'Ana Employee',
      };

      const token = await authLib.createToken(payload);
      
      const decoded = authLib.decodeToken(token);
      
      expect(decoded).toMatchObject({
        sub: '33333333333',
        cpf: '33333333333',
        user_type: 'funcionario',
        name: 'Ana Employee',
      });
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it('should have expiration time in the future', async () => {
      const payload = {
        sub: 'test',
        cpf: '',
        user_type: 'cliente' as const,
      };

      const token = await jwtService.createToken(payload);
      const decoded = jwtService.decodeToken(token);

      const now = Math.floor(Date.now() / 1000);
      expect(decoded?.iat).toBeLessThanOrEqual(now + 5); // Allow 5 seconds tolerance
      expect(decoded?.exp).toBeGreaterThan(now);
    });
  });

  describe('Error Handling Across Services', () => {
    it('should propagate token creation errors', () => {
      expect(() => {
        new JwtService('');
      }).toThrow('JWT_SECRET is required');
    });

    it('should handle invalid token gracefully', () => {
      const invalidToken = 'this.is.not.a.valid.token';
      
      const decoded = authLib.decodeToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should handle malformed tokens', () => {
      const malformed = 'malformed-token';
      
      const decoded = jwtService.decodeToken(malformed);
      expect(decoded).toBeNull();
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple simultaneous token creations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        authLib.createToken({
          sub: `user_${i}`,
          cpf: `${i}`.padStart(11, '0'),
          user_type: i % 2 === 0 ? 'cliente' : 'funcionario',
        })
      );

      const tokens = await Promise.all(promises);
      
      expect(tokens).toHaveLength(10);
      tokens.forEach(token => {
        expect(typeof token).toBe('string');
      });
    });

    it('should handle multiple simultaneous validations', async () => {
      const token = await authLib.createToken({
        sub: 'concurrent_test',
        cpf: '12345678901',
        user_type: 'cliente',
      });

      const promises = Array.from({ length: 10 }, () => 
        authLib.decodeToken(token)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result?.sub).toBe('concurrent_test');
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support anonymous customer checkout flow', async () => {
      const anonymousCustomer = {
        sub: `temp_${Date.now()}`,
        cpf: '',
        user_type: 'cliente' as const,
      };

      const token = await authLib.createToken(anonymousCustomer);
      const decoded = authLib.decodeToken(token);

      expect(decoded?.cpf).toBe('');
      expect(decoded?.user_type).toBe('cliente');
      expect(decoded?.name).toBeUndefined();
    });

    it('should support registered customer with full profile', async () => {
      const registeredCustomer = {
        sub: '99999999999',
        cpf: '99999999999',
        user_type: 'cliente' as const,
        name: 'Cliente Premium',
      };

      const token = await authLib.createToken(registeredCustomer);
      const decoded = authLib.decodeToken(token);

      expect(decoded?.cpf).toBe('99999999999');
      expect(decoded?.name).toBe('Cliente Premium');
    });

    it('should support employee with administrative access', async () => {
      const employee = {
        sub: '88888888888',
        cpf: '88888888888',
        user_type: 'funcionario' as const,
        name: 'Gerente Admin',
      };

      const token = await authLib.createToken(employee);
      const decoded = authLib.decodeToken(token);

      expect(decoded?.user_type).toBe('funcionario');
      expect(decoded?.cpf).toBe('88888888888');
    });
  });
});
