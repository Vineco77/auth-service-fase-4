import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AppError } from '../../core/domain/errors/app.error';

/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas) numbers
 * CPF is the Brazilian individual taxpayer registry identification
 */
@ValidatorConstraint({ async: false })
export class IsCPFConstraint implements ValidatorConstraintInterface {
  private static readonly CPF_LENGTH = 11;

  /**
   * Validates if a string is a valid CPF number
   * @param cpf - The CPF string to validate
   * @returns boolean indicating if the CPF is valid
   */
  validate(cpf: string): boolean {
    if (!this.isValidInput(cpf)) {
      return false;
    }

    const cleanCpf = this.sanitizeCPF(cpf);

    if (!this.hasValidFormat(cleanCpf)) {
      return false;
    }

    const firstDigit = this.calculateCheckDigit(cleanCpf, 9);
    if (firstDigit !== parseInt(cleanCpf.charAt(9))) {
      return false;
    }

    const secondDigit = this.calculateCheckDigit(cleanCpf, 10);
    return secondDigit === parseInt(cleanCpf.charAt(10));
  }

  /**
   * Provides the error message for invalid CPFs
   */
  defaultMessage(): string {
    throw AppError.badRequest({
      message: 'Invalid document',
    });
  }

  /**
   * Validates if input is a non-empty string
   */
  private isValidInput(cpf: any): boolean {
    return typeof cpf === 'string' && cpf.trim().length > 0;
  }

  /**
   * Removes non-digit characters from CPF
   */
  private sanitizeCPF(cpf: string): string {
    return cpf.replace(/[^\d]+/g, '');
  }

  /**
   * Checks if CPF has valid format (11 digits and not all repeated digits)
   */
  private hasValidFormat(cpf: string): boolean {
    if (cpf.length !== IsCPFConstraint.CPF_LENGTH) {
      return false;
    }

    // Check for all repeated digits (invalid CPF pattern)
    if (/^(\d)\1+$/.test(cpf)) {
      return false;
    }

    return true;
  }

  /**
   * Calculates the check digit for CPF validation
   * @param cpf - The cleaned CPF string
   * @param digitsToUse - Number of digits to use in calculation (9 for first check, 10 for second)
   * @returns The calculated verification digit
   */
  private calculateCheckDigit(cpf: string, digitsToUse: number): number {
    let sum = 0;

    for (let i = 0; i < digitsToUse; i++) {
      sum += parseInt(cpf.charAt(i)) * (digitsToUse + 1 - i);
    }

    const remainder = sum % 11;
    const checkDigit = 11 - remainder;

    return checkDigit >= 10 ? 0 : checkDigit;
  }
}

/**
 * Decorator that validates if a property is a valid CPF
 * @param validationOptions - Options for the validation
 * @returns PropertyDecorator function
 * @example
 * class Person {
 *   @IsCPF()
 *   cpf: string;
 * }
 */
export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCPFConstraint,
    });
  };
}
