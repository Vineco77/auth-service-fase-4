const { CognitoIdentityProviderClient, AdminGetUserCommand, SignUpCommand, AdminInitiateAuthCommand, AdminSetUserPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");

class CognitoService {
    constructor() {
        this.client = new CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || 'us-east-1'
        })
    }

    async userExists(username) {
        try {
            const command = new AdminGetUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username
            });
            await this.client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'UserNotFoundException') {
                return false
            }
            throw error;
        }
    }

    async signUpUser(cpf) {
        const username = cpf;
        const temporaryPassword = this.generateTemporaryPasswordFromUsername(username);
        const email = `${cpf}@temp.com`;

        try {
            const signUpCommand = new SignUpCommand({
                ClientId: process.env.COGNITO_CLIENT_ID,
                Username: username,
                Password: temporaryPassword,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email
                    },
                    {
                        Name: 'custom:cpf',
                        Value: cpf
                    }
                ]
            });

            const signUpResponse = await this.client.send(signUpCommand);

            await this.setUserPassword(username, temporaryPassword);

            return {
                success: true,
                userSub: signUpResponse.UserSub,
                message: 'Usuário criado com sucesso no Cognito'
            };

        } catch (error) {
            if (error.name === 'UsernameExistsException') {
                return {
                    success: false,
                    message: 'Usuário já existe no Cognito'
                };
            }
            throw error;
        }
    }

    async setUserPassword(username, password) {
        try {
            const command = new AdminSetUserPasswordCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                Password: password,
                Permanent: true
            })
            await this.client.send(command)
        } catch (error) {
            console.log('Não foi possivel definir senha permantente: ', error.message);
        }
    }

    async authenticateUser(username) {
        try {

            const temporaryPassword = this.generateTemporaryPasswordFromUsername(username);

            const command = new AdminInitiateAuthCommand({
                AuthFlow: 'ADMIN_NO_SRP_AUTH',
                ClientId: process.env.COGNITO_CLIENT_ID,
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: temporaryPassword
                }
            });

            const response = await this.client.send(command);

            return {
                success: true,
                tokens: response.AuthenticationResult
            }
        } catch (error) {
            return {
                success: false,
                message: 'Erro na autenticação',
                error: error.message
            }
        }
    }

    // async getCognitoJWT(cpf) {
    //     try {
    //         const authResult = await this.authenticateUser(cpf);

    //         if (authResult.success) {
    //             return {
    //                 success: true,
    //                 token: authResult.tokens.IdToken || authResult.tokens.AccessToken,
    //                 tokenType: 'Bearer',
    //                 expiresIn: authResult.tokens.ExpiresIn || 3600
    //             }
    //         }

    //         const signUpResult = await this.signUpUser(cpf);
    //         if (!signUpResult.success) {
    //             return {
    //                 success: false,
    //                 message: signUpResult.message
    //             }
    //         }

    //         await new Promise(resolve => setTimeout(resolve, 1000))

    //         const retryAuth = await this.authenticateUser(cpf);
    //         if (retryAuth.success) {
    //             return {
    //                 success: true,
    //                 token: retryAuth.tokens.IdToken || retryAuth.tokens.AccessToken,
    //                 tokenType: 'Bearer',
    //                 expiresIn: retryAuth.tokens.ExpiresIn || 3600
    //             };
    //         }

    //         return {
    //             success: false,
    //             message: 'Falha ao obter JWT'
    //         }
    //     } catch (error) {
    //         console.log('Error ao obter JWT: ', error);
    //         return {
    //             success: false,
    //             message: error.message
    //         }
    //     }
    // }

    async getCognitoJWT(cpf) {
        try {
            console.log('🔍 Iniciando getCognitoJWT para CPF:', cpf);
            const exists = await this.userExists(cpf)
            console.log('📋 Usuário existe no Cognito?', exists);

            if (exists) {
                console.log('🔐 Tentando autenticar usuário existente...');
                const authResult = await this.authenticateUser(cpf);
                console.log('✅ Resultado autenticação:', authResult.success, authResult.message);

                if (authResult.success) {
                    return {
                        success: true,
                        token: authResult.tokens.IdToken || authResult.tokens.AccessToken,
                        tokenType: 'Bearer ',
                        expiresIn: authResult.tokens.ExpiresIn || 3600
                    };
                }
            }

            console.log('👤 Criando novo usuário...');
            const signUpResult = await this.signUpUser(cpf);
            console.log('✅ Resultado signup:', signUpResult.success, signUpResult.message);

            if (!signUpResult.success && signUpResult.message !== 'Usuário já existe no Cognito') {
                return {
                    success: false,
                    message: signUpResult.message
                };
            }

            console.log('⏰ Aguardando propagação do usuário...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('🔐 Tentando autenticar após criação...');
            const finalAuth = await this.authenticateUser(cpf);
            console.log('✅ Resultado autenticação final:', finalAuth.success, finalAuth.message);

            if (finalAuth.success) {
                return {
                    success: true,
                    token: finalAuth.tokens.IdToken || finalAuth.tokens.AccessToken,
                    tokenType: 'Bearer',
                    expiresIn: finalAuth.tokens.ExpiresIn || 3600
                }
            }

            console.log('❌ Falha completa no processo de JWT');

            return {
                success: false,
                message: 'Falha ao obter JWT após criação do usuário.'
            }

        } catch (error) {
            console.error('💥 Erro ao obter JWT: ', error);
            return {
                success: false,
                message: error.message
            }
        }
    }

    generateTemporaryPasswordFromUsername(username) {
        const seed = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomPart = Math.abs(Math.sin(seed) * 10000).toString(36).slice(-6);
        return `TempPass${randomPart}!`;
    }
}

module.exports = { CognitoService }