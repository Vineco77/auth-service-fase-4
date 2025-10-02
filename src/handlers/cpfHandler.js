const { CPFValidator } = require('../utils/cpfValidator');
const { CognitoService } = require('../services/cognitoService');

const cognitoService = new CognitoService();

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));

    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        let cpf;

        if (event.httpMethod === 'POST') {
            try {
                const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                cpf = body.cpf;
            } catch (parseError) {
                console.error('Error parsing body:', parseError);
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: 'Invalid JSON body',
                        message: parseError.message
                    })
                };
            }
        } else {
            return {
                statusCode: 405,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Method not allowed',
                    message: 'Only POST method is supported'
                })
            };
        }

        if (!cpf) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'CPF não fornecido',
                    message: 'Por favor, forneça um CPF no body da requisição'
                })
            };
        }

        console.log('CPF received:', cpf);

        const validationResult = CPFValidator.validate(cpf);
        if (!validationResult.isValid) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'CPF inválido',
                    message: validationResult.message,
                    cpf: cpf
                })
            };
        }

        const cleanedCPF = validationResult.cleanedCPF;
        console.log('Cleaned CPF:', cleanedCPF);

        const jwtResult = await cognitoService.getCognitoJWT(cleanedCPF);
        console.log('JWT Result:', jwtResult);

        if (!jwtResult.success) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Erro no Cognito',
                    message: jwtResult.message,
                    cpf: cleanedCPF
                })
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
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
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Erro interno do servidor',
                message: error.message
            })
        };
    }
};