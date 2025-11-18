const { AuthLib } = require('../dist/index.js');

// Teste básico da lib
async function testLib() {
  try {
    const authLib = new AuthLib('seu-jwt-secret-aqui');
    
    // 1. Criar um token
    const token = await authLib.createToken({
      sub: '12345678901',
      cpf: '12345678901', 
      user_type: 'cliente',
      name: 'João Teste'
    });
    
    console.log('✅ Token criado:', token);
    
    // 2. Validar o token
    const payload = await authLib.validateToken(token);
    console.log('✅ Token validado:', payload);
    
    // 3. Testar token inválido
    try {
      await authLib.validateToken('token-invalido');
      console.log('❌ ERRO: Token inválido deveria falhar');
    } catch (error) {
      console.log('✅ Token inválido rejeitado corretamente');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testLib();