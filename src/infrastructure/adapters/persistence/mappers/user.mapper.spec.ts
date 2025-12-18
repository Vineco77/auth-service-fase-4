import { UserMapper } from './user.mapper';
import { UserEntity } from '../../../../core/domain/entities/user.entity';

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('should map raw data to UserEntity', () => {
      const rawData = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
      };

      const result = UserMapper.toDomain(rawData);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe(1);
      expect(result.cpf).toBe('12345678901');
      expect(result.name).toBe('John Doe');
    });

    it('should handle raw data with different values', () => {
      const rawData = {
        id: 99,
        cpf: '98765432109',
        name: 'Jane Smith',
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.id).toBe(99);
      expect(result.cpf).toBe('98765432109');
      expect(result.name).toBe('Jane Smith');
    });

    it('should handle null id', () => {
      const rawData = {
        id: null,
        cpf: '11111111111',
        name: 'Bob Johnson',
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.id).toBeNull();
      expect(result.cpf).toBe('11111111111');
    });

    it('should handle extra properties in raw data', () => {
      const rawData = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
        extraField: 'should be ignored',
        anotherField: 123,
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.id).toBe(1);
      expect(result.cpf).toBe('12345678901');
      expect(result.name).toBe('John Doe');
    });

    it('should handle special characters in name', () => {
      const rawData = {
        id: 1,
        cpf: '12345678901',
        name: "O'Connor José-María",
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.name).toBe("O'Connor José-María");
    });
  });

  describe('toPersistence', () => {
    it('should map UserEntity to persistence format without id', () => {
      const user = UserEntity.create({
        cpf: '12345678901',
        name: 'John Doe',
      });

      const result = UserMapper.toPersistence(user);

      expect(result).toEqual({
        cpf: '12345678901',
        name: 'John Doe',
      });
      expect(result.id).toBeUndefined();
    });

    it('should map UserEntity to persistence format with id', () => {
      const user = new UserEntity(1, '12345678901', 'John Doe');

      const result = UserMapper.toPersistence(user);

      expect(result).toEqual({
        cpf: '12345678901',
        name: 'John Doe',
        id: 1,
      });
    });

    it('should not include id when id is null', () => {
      const user = new UserEntity(null, '98765432109', 'Jane Smith');

      const result = UserMapper.toPersistence(user);

      expect(result).toEqual({
        cpf: '98765432109',
        name: 'Jane Smith',
      });
      expect(result.id).toBeUndefined();
    });

    it('should handle different user values', () => {
      const user = new UserEntity(99, '11111111111', 'Bob Johnson');

      const result = UserMapper.toPersistence(user);

      expect(result.id).toBe(99);
      expect(result.cpf).toBe('11111111111');
      expect(result.name).toBe('Bob Johnson');
    });

    it('should handle special characters in name', () => {
      const user = new UserEntity(1, '12345678901', "O'Connor José");

      const result = UserMapper.toPersistence(user);

      expect(result.name).toBe("O'Connor José");
    });

    it('should handle id value of 0', () => {
      const user = new UserEntity(0, '12345678901', 'John Doe');

      const result = UserMapper.toPersistence(user);

      // 0 is falsy, so it won't be included based on the implementation
      expect(result.id).toBeUndefined();
    });
  });

  describe('round-trip mapping', () => {
    it('should maintain data integrity through toDomain and toPersistence', () => {
      const originalData = {
        id: 1,
        cpf: '12345678901',
        name: 'John Doe',
      };

      const domain = UserMapper.toDomain(originalData);
      const persistence = UserMapper.toPersistence(domain);

      expect(persistence.id).toBe(originalData.id);
      expect(persistence.cpf).toBe(originalData.cpf);
      expect(persistence.name).toBe(originalData.name);
    });

    it('should handle round-trip without id', () => {
      const originalData = {
        id: null,
        cpf: '98765432109',
        name: 'Jane Smith',
      };

      const domain = UserMapper.toDomain(originalData);
      const persistence = UserMapper.toPersistence(domain);

      expect(persistence.id).toBeUndefined();
      expect(persistence.cpf).toBe(originalData.cpf);
      expect(persistence.name).toBe(originalData.name);
    });
  });
});
