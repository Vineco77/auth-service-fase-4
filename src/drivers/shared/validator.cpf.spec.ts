import { IsCPFConstraint } from './validator.cpf';
import { AppError } from '../../core/domain/errors/app.error';

describe('IsCPFConstraint', () => {
  let validator: IsCPFConstraint;

  beforeEach(() => {
    validator = new IsCPFConstraint();
  });

  describe('validate', () => {
    describe('valid CPFs', () => {
      it('should validate a valid CPF with 11 digits', () => {
        // Using a known valid CPF pattern
        const result = validator.validate('12345678909');
        expect(result).toBe(true);
      });

      it('should validate CPF with formatting characters', () => {
        const result = validator.validate('123.456.789-09');
        expect(result).toBe(true);
      });

      it('should validate another valid CPF', () => {
        const result = validator.validate('11144477735');
        expect(result).toBe(true);
      });
    });

    describe('invalid CPFs', () => {
      it('should reject CPF with less than 11 digits', () => {
        const result = validator.validate('123456789');
        expect(result).toBe(false);
      });

      it('should reject CPF with more than 11 digits', () => {
        const result = validator.validate('123456789012');
        expect(result).toBe(false);
      });

      it('should reject CPF with all repeated digits', () => {
        const repeatedDigits = [
          '00000000000',
          '11111111111',
          '22222222222',
          '33333333333',
          '44444444444',
          '55555555555',
          '66666666666',
          '77777777777',
          '88888888888',
          '99999999999',
        ];

        repeatedDigits.forEach((cpf) => {
          const result = validator.validate(cpf);
          expect(result).toBe(false);
        });
      });

      it('should reject empty string', () => {
        const result = validator.validate('');
        expect(result).toBe(false);
      });

      it('should reject whitespace only', () => {
        const result = validator.validate('   ');
        expect(result).toBe(false);
      });

      it('should reject CPF with letters', () => {
        const result = validator.validate('1234567890a');
        expect(result).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validator.validate(12345678901 as any);
        expect(result).toBe(false);
      });

      it('should reject null', () => {
        const result = validator.validate(null as any);
        expect(result).toBe(false);
      });

      it('should reject undefined', () => {
        const result = validator.validate(undefined as any);
        expect(result).toBe(false);
      });

      it('should reject object', () => {
        const result = validator.validate({} as any);
        expect(result).toBe(false);
      });

      it('should reject array', () => {
        const result = validator.validate([] as any);
        expect(result).toBe(false);
      });

      it('should reject CPF with invalid check digits', () => {
        const result = validator.validate('12345678901'); // Invalid check digits
        expect(result).toBe(false);
      });
    });

    describe('formatting handling', () => {
      it('should accept CPF with dots and dash', () => {
        const result = validator.validate('111.444.777-35');
        expect(result).toBe(true);
      });

      it('should accept CPF with spaces', () => {
        const result = validator.validate('111 444 777 35');
        expect(result).toBe(true);
      });

      it('should accept CPF with mixed formatting', () => {
        const result = validator.validate('111.444.777 35');
        expect(result).toBe(true);
      });
    });
  });

  describe('defaultMessage', () => {
    it('should throw AppError with bad request', () => {
      expect(() => validator.defaultMessage()).toThrow(AppError);
    });

    it('should throw AppError with correct error type', () => {
      try {
        validator.defaultMessage();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).errorType).toBe('BadRequestError');
      }
    });

    it('should throw AppError with correct message', () => {
      try {
        validator.defaultMessage();
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as any).response.message).toBe('Invalid document');
      }
    });
  });

  describe('check digit calculation', () => {
    it('should correctly validate CPF with valid first check digit', () => {
      // CPF: 111.444.777-35
      // First 9 digits: 111444777
      // First check digit should be 3
      const result = validator.validate('11144477735');
      expect(result).toBe(true);
    });

    it('should reject CPF with invalid first check digit', () => {
      // Using wrong first check digit
      const result = validator.validate('11144477745'); // Last digit changed to make it invalid
      expect(result).toBe(false);
    });

    it('should reject CPF with invalid second check digit', () => {
      // Using wrong second check digit
      const result = validator.validate('11144477734'); // Last digit changed
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle CPF with leading zeros', () => {
      const result = validator.validate('00000000191');
      expect(result).toBe(true);
    });

    it('should trim whitespace from CPF', () => {
      const result = validator.validate('  11144477735  ');
      expect(result).toBe(true);
    });

    it('should handle very long strings', () => {
      const result = validator.validate('1'.repeat(100));
      expect(result).toBe(false);
    });

    it('should handle special characters mixed with numbers', () => {
      const result = validator.validate('111@444#777$35');
      expect(result).toBe(true); // Should sanitize to valid CPF
    });
  });
});
