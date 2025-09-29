#!/bin/bash
echo "🔍 Diagnóstico de conectividade AWS..."

echo "1. Verificando variáveis de ambiente:"
env | grep AWS

echo "2. Verificando credenciais:"
aws sts get-caller-identity || echo "❌ Falha nas credenciais"

echo "3. Testando DNS:"
nslookup sts.us-east-1.amazonaws.com || echo "❌ Falha no DNS"

echo "4. Testando conectividade:"
curl -I --connect-timeout 5 https://sts.us-east-1.amazonaws.com/ || echo "❌ Falha na conexão"

echo "5. Verificando configuração AWS:"
aws configure list