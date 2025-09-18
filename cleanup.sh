#!/bin/bash
set -e

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🗑️ INICIANDO LIMPEZA COMPLETA ULTIMATE..."

# 0. DELETAR LAMBDA FUNCTION
echo "🔻 Deletando Lambda Function..."
aws lambda delete-function --function-name cpf-cognito-lambda-handler --region $REGION 2>/dev/null || echo "✅ Lambda já não existe"

# 1. DELETAR USER POOLS E APP CLIENTS (COM tratamento de deletion protection)
echo "🔻 Deletando User Pools e App Clients..."
USER_POOLS=$(aws cognito-idp list-user-pools --max-results 60 --region $REGION --query "UserPools[].Id" --output text)

for USER_POOL_ID in $USER_POOLS; do
    USER_POOL_NAME=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION --query "UserPool.Name" --output text 2>/dev/null || echo "")
    
    DOMAIN=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION --query "UserPool.Domain" --output text 2>/dev/null || echo "")
    if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "None" ]; then
        echo "🔻 Deletando domain: $DOMAIN"
        aws cognito-idp delete-user-pool-domain --user-pool-id $USER_POOL_ID --domain $DOMAIN --region $REGION 2>/dev/null || echo "✅ Domain já não existe"
        sleep 2
    fi

    # Deletar SE for relacionado a CPF
    if [[ "$USER_POOL_NAME" == *"cpf"* ]] || [[ "$USER_POOL_NAME" == *"CPF"* ]] || [[ "$USER_POOL_NAME" == *"cognito"* ]] || [[ "$USER_POOL_NAME" == *"Cognito"* ]]; then
        
        echo "📋 Processando User Pool: $USER_POOL_ID ($USER_POOL_NAME)"
        
        # 1. Primeiro desativar deletion protection se estiver ativado
        echo "🔓 Verificando deletion protection..."
        DELETION_PROTECTION=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION --query "UserPool.DeletionProtection" --output text 2>/dev/null || echo "INACTIVE")
        
        if [ "$DELETION_PROTECTION" = "ACTIVE" ]; then
            echo "🔓 Desativando deletion protection..."
            aws cognito-idp update-user-pool --user-pool-id $USER_POOL_ID --region $REGION --deletion-protection "INACTIVE" 2>/dev/null || echo "⚠️  Não foi possível desativar deletion protection"
            sleep 2
        fi
        
        # 2. Deletar App Clients
        echo "📋 Encontrando App Clients..."
        APP_CLIENTS=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --region $REGION --query "UserPoolClients[].ClientId" --output text 2>/dev/null || echo "")
        
        for CLIENT_ID in $APP_CLIENTS; do
            echo "🔻 Deletando App Client: $CLIENT_ID"
            aws cognito-idp delete-user-pool-client --user-pool-id $USER_POOL_ID --client-id $CLIENT_ID --region $REGION 2>/dev/null || echo "✅ App Client já não existe"
        done
        
        # 3. Deletar User Pool
        echo "🔻 Deletando User Pool: $USER_POOL_ID"
        aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID --region $REGION 2>/dev/null || echo "✅ User Pool já não existe"
        echo "✅ User Pool processado: $USER_POOL_ID"
    else
        echo "⏭️  Pulando User Pool não relacionado: $USER_POOL_ID ($USER_POOL_NAME)"
    fi
done

# 2. DELETAR CLOUDWATCH LOG GROUPS
echo "🔻 Deletando Log Groups do CloudWatch..."
LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/cpf-cognito" --query "logGroups[].logGroupName" --output text 2>/dev/null || echo "")

for LOG_GROUP in $LOG_GROUPS; do
    echo "🔻 Deletando Log Group: $LOG_GROUP"
    aws logs delete-log-group --log-group-name "$LOG_GROUP" 2>/dev/null || echo "✅ Log Group já não existe"
done

# 3. DELETAR IAM ROLE (com force TOTAL)
echo "🔻 Deletando IAM Role..."
ROLE_NAME="cpf-cognito-lambda-lambda-role"

# Verificar se o role existe
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "🔓 Desanexando políticas do role..."
    
    # Desanexar políticas attached (com mais tentativas)
    ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name $ROLE_NAME --query "AttachedPolicies[].PolicyArn" --output text 2>/dev/null || echo "")
    for POLICY_ARN in $ATTACHED_POLICIES; do
        echo "🔓 Desanexando política: $POLICY_ARN"
        aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn "$POLICY_ARN" 2>/dev/null || true
        # Tentativa adicional com timeout
        sleep 1
        aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn "$POLICY_ARN" 2>/dev/null || true
    done
    
    # Deletar políticas inline (com mais tentativas)
    INLINE_POLICIES=$(aws iam list-role-policies --role-name $ROLE_NAME --query "PolicyNames" --output text 2>/dev/null || echo "")
    for POLICY_NAME in $INLINE_POLICIES; do
        echo "🔓 Deletando política inline: $POLICY_NAME"
        aws iam delete-role-policy --role-name $ROLE_NAME --policy-name "$POLICY_NAME" 2>/dev/null || true
        # Tentativa adicional
        sleep 1
        aws iam delete-role-policy --role-name $ROLE_NAME --policy-name "$POLICY_NAME" 2>/dev/null || true
    done
    
    # Aguardar propagação
    echo "⏳ Aguardando propagação das mudanças..."
    sleep 5
    
    # Deletar role com múltiplas tentativas
    echo "🔻 Deletando IAM Role: $ROLE_NAME"
    for i in {1..3}; do
        aws iam delete-role --role-name $ROLE_NAME 2>/dev/null && break
        echo "⚠️ Tentativa $i falhou, aguardando e tentando novamente..."
        sleep 3
    done || echo "✅ IAM Role já não existe"
    
    echo "✅ IAM Role processado: $ROLE_NAME"
else
    echo "✅ IAM Role já não existe"
fi

# 4. DELETAR IAM POLICIES (FORÇADO)
echo "🔻 Deletando IAM Policies (modo forçado)..."
POLICY_ARNS=$(aws iam list-policies --query "Policies[?contains(PolicyName, 'cpf')].Arn" --output text 2>/dev/null || echo "")

for POLICY_ARN in $POLICY_ARNS; do
    echo "🔻 Processando política: $POLICY_ARN"
    
    # Primeiro desanexar de qualquer role (se existir)
    echo "🔓 Desanexando política de roles..."
    ENTITIES=$(aws iam list-entities-for-policy --policy-arn "$POLICY_ARN" --query "PolicyRoles[].RoleName" --output text 2>/dev/null || echo "")
    for ROLE in $ENTITIES; do
        echo "🔓 Desanexando de role: $ROLE"
        aws iam detach-role-policy --role-name "$ROLE" --policy-arn "$POLICY_ARN" 2>/dev/null || true
    done
    
    # Deletar todas as versões não-default
    echo "🔓 Limpando versões da política..."
    VERSIONS=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query "Versions[?IsDefaultVersion==\`false\`].VersionId" --output text 2>/dev/null || echo "")
    for VERSION in $VERSIONS; do
        echo "🔓 Deletando versão: $VERSION"
        aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$VERSION" 2>/dev/null || true
    done
    
    # Deletar política
    echo "🔻 Deletando política: $POLICY_ARN"
    aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || echo "✅ Policy já não existe"
    echo "✅ Política processada: $POLICY_ARN"
done

# 5. DELETA MANUALMENTE O ROLE PERSISTENTE
aws iam delete-role --role-name cpf-cognito-lambda-lambda-role --region us-east-1

# 6. LIMPAR ARQUIVOS LOCAIS
echo "🧹 Limpando arquivos locais..."
rm -f trust-policy.json cognito-policy.json function.zip output.json deploy.zip .env 2>/dev/null || true
rm -rf ./*.zip ./*.tmp ./*.log ./dist ./build 2>/dev/null || true
echo "✅ Arquivos locais limpos"

echo "🎉 LIMPEZA ULTIMATE CONCLUÍDA!"
echo "✅ Agora você pode executar ./create-infrastructure.sh novamente"

# VERIFICAÇÃO FINAL
echo "🔍 VERIFICAÇÃO FINAL:"
echo "Lambda Functions: $(aws lambda list-functions --query 'Functions[?contains(FunctionName, `cpf-cognito`)].FunctionName' --output text 2>/dev/null || echo 'Nenhuma')"
echo "User Pools: $(aws cognito-idp list-user-pools --max-results 10 --region $REGION --query 'UserPools[].Id' --output text 2>/dev/null || echo 'Nenhum')"
echo "IAM Policies: $(aws iam list-policies --query 'Policies[?contains(PolicyName, `cpf`)].PolicyName' --output text 2>/dev/null || echo 'Nenhuma')"
echo "IAM Roles: $(aws iam list-roles --query 'Roles[?contains(RoleName, `cpf-cognito`)].RoleName' --output text 2>/dev/null || echo 'Nenhum')"