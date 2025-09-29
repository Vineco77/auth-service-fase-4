class CPFValidator {
    static cleanCPF(cpf) {
        return cpf.replace(/\D/g, '');
    }

    static isValidLength(cpf) {
        return cpf.length === 11;
    }

    static isRepeatedDigits(cpf) {
        return /^(\d)\1{10}$/.test(cpf);
    }

    static calculateDigit(cpf, factor) {
        let total = 0;
        for (const digit of cpf) {
            if (factor > 1) total += parseInt(digit) * factor--;
        }
        const remainder = total % 11;
        return remainder < 2 ? 0 : 11 - remainder
    }

    static validate(cpf) {
        try {
            const cleanedCPF = this.cleanCPF(cpf);

            if (!this.isValidLength(cleanedCPF)) {
                return {
                    isValid: false,
                    message: 'CPF deve ter 11 dígitos',
                    cleanedCPF: cleanedCPF
                };
            }

            if (this.isRepeatedDigits(cleanedCPF)) {
                return {
                    isValid: false,
                    message: 'CPF não pode ter todos dígitos iguais',
                    cleanedCPF: cleanedCPF
                };
            }


            const firstNineDigits = cleanedCPF.substring(0, 9);
            const firstVerifier = this.calculateDigit(firstNineDigits, 10);
            const secondVerifier = this.calculateDigit(firstNineDigits + firstVerifier, 11);

            if (firstVerifier !== parseInt(cleanedCPF[9]) || secondVerifier !== parseInt(cleanedCPF[10])) {
                return {
                    isValid: false,
                    message: 'Dígitos verificadores Inválidos',
                    cleanedCPF: cleanedCPF
                }
            }

            return {
                isValid: true,
                message: 'CPF válido',
                cleanedCPF: cleanedCPF
            }
        } catch (error) {
            return {
                isValid: false,
                message: 'Erro na validação do CPF'
            }
        }
    }
}

module.exports = { CPFValidator };