#!/bin/bash

# Configurações
FUNCTION_NAME="cpf-cognito-lambda-handler"
REGION="us-east-1"

echo "🔄 Empacotando a Lambda..."
npm install --production
zip -r deploy.zip src/ node_modules/ package.json .env

echo "🚀 Fazendo upload para AWS Lambda..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://deploy.zip \
  --region $REGION

echo "✅ Deploy concluído!"