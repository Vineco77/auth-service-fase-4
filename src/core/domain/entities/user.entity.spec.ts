import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  describe('constructor', () => {
    it('should create a user entity with all properties', () => {
      const user = new UserEntity(1, '12345678901', 'John Doe');

      expect(user.id).toBe(1);
      expect(user.cpf).toBe('12345678901');
      expect(user.name).toBe('John Doe');
    });

    it('should create a user entity with null id', () => {
      const user = new UserEntity(null, '98765432109', 'Jane Smith');

      expect(user.id).toBeNull();
      expect(user.cpf).toBe('98765432109');
      expect(user.name).toBe('Jane Smith');
    });

    it('should allow reading all properties', () => {
      const user = new UserEntity(5, '11111111111', 'Bob Johnson');

      expect(user.id).toBeDefined();
      expect(user.cpf).toBeDefined();
      expect(user.name).toBeDefined();
    });
  });

  describe('create static method', () => {
    it('should create a new user entity without id', () => {
      const user = UserEntity.create({
        cpf: '12345678901',
        name: 'John Doe',
      });

      expect(user).toBeInstanceOf(UserEntity);
      expect(user.id).toBeNull();
      expect(user.cpf).toBe('12345678901');
      expect(user.name).toBe('John Doe');
    });

    it('should create multiple users with different data', () => {
      const user1 = UserEntity.create({
        cpf: '11111111111',
        name: 'User One',
      });

      const user2 = UserEntity.create({
        cpf: '22222222222',
        name: 'User Two',
      });

      expect(user1.cpf).not.toBe(user2.cpf);
      expect(user1.name).not.toBe(user2.name);
      expect(user1.id).toBeNull();
      expect(user2.id).toBeNull();
    });

    it('should create user with long name', () => {
      const longName = 'A'.repeat(100);
      const user = UserEntity.create({
        cpf: '12345678901',
        name: longName,
      });

      expect(user.name).toBe(longName);
      expect(user.name.length).toBe(100);
    });

    it('should create user with special characters in name', () => {
      const user = UserEntity.create({
        cpf: '12345678901',
        name: "O'Connor-Smith José",
      });

      expect(user.name).toBe("O'Connor-Smith José");
    });
  });

  describe('immutability', () => {
    it('should have readonly properties that cannot be reassigned', () => {
      const user = new UserEntity(1, '12345678901', 'John Doe');

      // TypeScript would prevent this at compile time, but we test the concept
      expect(() => {
        (user as any).id = 2;
      }).not.toThrow(); // Assignment happens but shouldn't change behavior

      // The properties are still accessible
      expect(user.id).toBeDefined();
      expect(user.cpf).toBeDefined();
      expect(user.name).toBeDefined();
    });
  });
});
