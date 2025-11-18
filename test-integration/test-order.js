const { AuthLib } = require('@fast-food/auth-lib');

class OrderService {
    constructor() {
        this.authLib = new AuthLib(process.env.JWT_SECRET || 'seu-jwt-secret-aqui');
    }

    async createOrder(token, orderData) {
        try {
            // Validação LOCAL com a lib
            const payload = await this.authLib.validateToken(token);

            console.log('✅ Order Service - Token válido:');
            console.log('   Usuário:', payload.name);
            console.log('   Tipo:', payload.user_type);
            console.log('   CPF:', payload.cpf);

            // Simular criação de pedido
            return {
                success: true,
                orderId: '12345',
                user: payload
            };

        } catch (error) {
            console.log('❌ Order Service - Token inválido:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Teste
async function testOrderService() {
    const orderService = new OrderService();

    // Primeiro, pegue um token válido do auth-service
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MTMyNTU1NjA3NiIsImNwZiI6IjQxMzI1NTU2MDc2IiwidXNlcl90eXBlIjoiY2xpZW50ZSIsIm5hbWUiOiJUZXN0ZSBJbnRlZ3Jhw6fDo28iLCJpYXQiOjE3NjM1MDQ4NTcsImV4cCI6MTc2MzUwNTc1NywiaXNzIjoiYXV0aC1zZXJ2aWNlIn0.doXkZdJT0JDPeixN6KPPzI7w0VYlChMu1lbWS5CDiYA';

    if (!validToken || validToken === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MTMyNTU1NjA3NiIsImNwZiI6IjQxMzI1NTU2MDc2IiwidXNlcl90eXBlIjoiY2xpZW50ZSIsIm5hbWUiOiJUZXN0ZSBJbnRlZ3Jhw6fDo28iLCJpYXQiOjE3NjM1MDQ4NTcsImV4cCI6MTc2MzUwNTc1NywiaXNzIjoiYXV0aC1zZXJ2aWNlIn0.doXkZdJT0JDPeixN6KPPzI7w0VYlChMu1lbWS5CDiYA') {
        console.log('⚠️  Pule para o Auth Service e pegue um token válido primeiro');
        console.log('   curl -X POST http://localhost:1337/auth/token -H "Content-Type: application/json" -d \'{"name": "Teste"}\'');
        return;
    }

    console.log('🧪 Testando Order Service com token:', validToken.substring(0, 50) + '...');

    const result = await orderService.createOrder(validToken, {
        items: ['Hamburguer', 'Batata'],
        total: 29.90
    });

    console.log('📦 Resultado do pedido:', result);
}

testOrderService();