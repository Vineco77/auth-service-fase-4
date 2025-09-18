const { CPFValidator } = require('../utils/cpfValidator');
const { CognitoService } = require('../services/cognitoService');

const cognitoService = new CognitoService();

exports.handler = async (event) => {
    try {
        console.log('Event received:', JSON.stringify(event, null, 2));

        let cpf;
        if (event.body) {
            const body = JSON.parse(event.body);
            cpf = body.cpf;
        } else if (event.cpf) {
            cpf = event.cpf;
        } else if (event.queryStringParameters && event.queryStringParameters.cpf) {
            cpf = event.queryStringParameters.cpf;
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'CPF não fornecido',
                    message: 'Por favor, forneça um CPF no body ou query parameters'
                })
            };
        }

        const validationResult = CPFValidator.validate(cpf);
        if (!validationResult.isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'CPF inválido',
                    message: validationResult.message,
                    cpf: cpf
                })
            };
        }

        const cleanedCPF = validationResult.cleanedCPF;

        const jwtResult = await cognitoService.getCognitoJWT(cleanedCPF);

        if (!jwtResult.success) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Erro no Cognito',
                    message: jwtResult.message,
                    cpf: cleanedCPF
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'CPF validado e autenticado com sucesso',
                cpf: cleanedCPF,
                token: jwtResult.token,
                tokenType: jwtResult.tokenType,
                expiresIn: jwtResult.expiresIn
            })
        };

    } catch (error) {
        console.error('Error in Lambda execution:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Erro interno do servidor',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};