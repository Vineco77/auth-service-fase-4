const { CPFValidator } = require('../utils/cpfValidator');
const { CognitoService } = require('../services/cognitoService');

// Debug: Verificar se as dependências estão carregando
console.log('CPFValidator:', typeof CPFValidator);
console.log('CognitoService:', typeof CognitoService);

// Carregar .env manualmente se necessário
require('dotenv').config();

console.log('Environment Variables:', {
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID
});

const cognitoService = new CognitoService();

exports.handler = async (event) => {
    try {
        console.log('Event received:', JSON.stringify(event, null, 2));

        let cpf;
        if (event.body) {
            try {
                const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                cpf = body.cpf;
            } catch (parseError) {
                console.error('Error parsing body:', parseError);
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: 'Invalid JSON body',
                        message: parseError.message
                    })
                };
            }
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

        console.log('CPF received:', cpf);

        // Validar CPF
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
        console.log('Cleaned CPF:', cleanedCPF);

        // Obter JWT do Cognito
        const jwtResult = await cognitoService.getCognitoJWT(cleanedCPF);
        console.log('JWT Result:', jwtResult);

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
        console.error('Error stack:', error.stack);

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