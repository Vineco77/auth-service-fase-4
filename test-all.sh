#!/bin/bash

echo "🧪 INICIANDO TESTES COMPLETOS"

# Iniciar database primeiro
echo "1. Iniciando PostgreSQL..."
cd /home/vinicius_ribeiro/11soat-fast-food-fase-3-lambda
docker-compose up -d
sleep 3

# Teste 1: Lib isolada (NÃO depende do database)
echo "2. Testando Lib..."
cd libs/auth-lib
npm run build
node test/test-lib.js

# Teste 2: Auth Service (agora com database)
echo "3. Testando Auth Service..."
cd ..
npm run build
npm start &
AUTH_PID=$!
sleep 5

# Verificar se o Auth Service está rodando
if ps -p $AUTH_PID > /dev/null; then
    echo "✅ Auth Service rodando (PID: $AUTH_PID)"
    
    # Teste 3: Gerar token real para teste de integração
    echo "4. Gerando token real para teste..."
    TOKEN_RESPONSE=$(curl -s -X POST http://localhost:1337/auth/token \
        -H "Content-Type: application/json" \
        -d '{"name": "Usuário Teste"}')
    
    TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Token gerado: ${TOKEN:0:50}..."
        
        # Teste 4: Integração com token real
        echo "5. Testando integração com token real..."
        cd test-integration
        JWT_SECRET="seu-jwt-secret-aqui" TOKEN_TEST="$TOKEN" node test-order.js
    else
        echo "❌ Falha ao gerar token"
    fi
    
    # Finalizar Auth Service
    kill $AUTH_PID 2>/dev/null
else
    echo "❌ Auth Service não iniciou corretamente"
fi

echo "✅ TESTES CONCLUÍDOS"