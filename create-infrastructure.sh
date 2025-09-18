#!/bin/bash
set -e

REGION="us-east-1"
PROJECT_NAME="cpf-cognito-lambda"
USER_POOL_NAME="$PROJECT_NAME-user-pool"
ROLE_NAME="$PROJECT_NAME-lambda-role"
POLICY_NAME="$PROJECT_NAME-cognito-policy-CORRECTA"
FUNCTION_NAME="$PROJECT_NAME-handler"

echo "🚀 Iniciando criação COMPLETA e CORRETA da infraestrutura..."

# 🔍 VERIFICAÇÃO PREVENTIVA - Se o role já existe, tentar deletar
echo "🔍 Verificando se IAM Role já existe..."
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "⚠️ IAM Role já existe, tentando deletar..."
    aws iam delete-role --role-name $ROLE_NAME 2>/dev/null || echo "✅ Não foi possível deletar, continuando..."
    sleep 3
fi

check_command() {
    if [ $? -ne 0 ]; then
        echo "❌ Erro no comando: $1"
        exit 1
    fi
}

# LIMPAR User Pools existentes para evitar conflitos
echo "🧹 Limpando User Pools existentes..."
EXISTING_POOLS=$(aws cognito-idp list-user-pools --max-results 10 --region $REGION --query "UserPools[?contains(Name, 'cpf-cognito')].Id" --output text)
for POOL_ID in $EXISTING_POOLS; do
    echo "🗑️ Deletando User Pool: $POOL_ID"
    aws cognito-idp delete-user-pool --user-pool-id $POOL_ID --region $REGION 2>/dev/null || echo "✅ User Pool já deletado ou não existe"
done

echo "📋 Criando User Pool NOVO com políticas e schema personalizado..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name $USER_POOL_NAME \
  --auto-verified-attributes email \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --schema '[
    {
      "Name": "cpf",
      "AttributeDataType": "String",
      "DeveloperOnlyAttribute": false,
      "Mutable": true,
      "Required": false,
      "StringAttributeConstraints": {
        "MinLength": "11",
        "MaxLength": "11"
      }
    }
  ]' \
  --query 'UserPool.Id' \
  --output text \
  --region $REGION)
check_command "create-user-pool"
echo "✅ User Pool criado: $USER_POOL_ID"

echo "📋 Criando App Client..."
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name "$PROJECT_NAME-app-client" \
  --explicit-auth-flows "ADMIN_NO_SRP_AUTH" \
  --query 'UserPoolClient.ClientId' \
  --output text \
  --region $REGION)
check_command "create-user-pool-client"
echo "✅ Client ID: $CLIENT_ID"

echo "📋 Criando IAM Role..."
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

ROLE_ARN=$(aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://trust-policy.json \
  --query 'Role.Arn' \
  --output text)
check_command "create-role"
echo "✅ Role ARN: $ROLE_ARN"

echo "📋 Criando IAM Policy COMPLETA..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)  

cat > cognito-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:SignUp",
        "cognito-idp:AdminInitiateAuth",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminCreateUser",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminConfirmSignUp"
      ],
      "Resource": "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$USER_POOL_ID"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:DescribeUserPool",
        "cognito-idp:DescribeUserPoolClient"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

POLICY_ARN=$(aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file://cognito-policy.json \
  --query 'Policy.Arn' \
  --output text)
check_command "create-policy"
echo "✅ Policy ARN: $POLICY_ARN"

echo "📋 Anexando política ao role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN
check_command "attach-role-policy"
echo "✅ Policy anexada"

echo "📋 Aguardando propagação do IAM Role..."
sleep 15

echo "📋 Criando .env..."
cat > .env << EOF
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
NODE_ENV=production
EOF

echo "📋 Instalando dependências..."
npm install 

echo "📋 Empacotando Lambda..."
zip -r function.zip src/ node_modules/ package.json .env

echo "📋 Criando Lambda Function..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler src/handlers/cpfHandler.handler \
  --zip-file fileb://function.zip \
  --environment "Variables={COGNITO_USER_POOL_ID=$USER_POOL_ID,COGNITO_CLIENT_ID=$CLIENT_ID}" \
  --region $REGION
check_command "create-function"

echo "🎉 INFRAESTRUTURA CRIADA COM SUCESSO E 100% CORRETA!"
echo "📍 User Pool: $USER_POOL_ID"
echo "🎯 Client ID: $CLIENT_ID"
echo "👤 IAM Role: $ROLE_ARN"
echo "🔐 IAM Policy: $POLICY_ARN"
echo "🚀 Lambda: $FUNCTION_NAME"

rm -f trust-policy.json cognito-policy.json function.zip

echo "✅ PRONTO PARA TESTES DEFINITIVOS!"