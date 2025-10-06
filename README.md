# Fast Food - Fase 3 - Autenticação de Cliente com CPF

Este projeto implementa um sistema de autenticação de clientes para uma aplicação de fast food, utilizando uma arquitetura serverless na AWS. O cliente é identificado unicamente pelo seu CPF, sem a necessidade de senha.

## Fluxo da Aplicação

O fluxo de autenticação e cadastro de clientes segue os seguintes passos:

1.  **Requisição do Cliente**: O cliente envia uma requisição `POST` para a rota `/cadastro` do API Gateway, contendo o CPF no corpo da requisição.
2.  **Invocação do API Gateway**: O API Gateway recebe a requisição e invoca a função Lambda `cpf-cognito-lambda-handler`.
3.  **Validação na Lambda**: A função Lambda:
    *   Valida o formato do CPF (verifica se tem 11 dígitos, se não são todos repetidos e se os dígitos verificadores são válidos).
    *   Se o CPF for válido, a função se comunica com o Amazon Cognito.
4.  **Registro no Cognito**: A função Lambda utiliza o serviço do Cognito para:
    *   Verificar se já existe um usuário com o CPF informado.
    *   Se não existir, cria um novo usuário no User Pool do Cognito.
5.  **Retorno com JWT**: O Cognito, após criar ou identificar o usuário, gera um token JWT que é retornado pela Lambda, através do API Gateway, para o cliente. Esse token pode ser usado para autenticar o cliente em outras partes da aplicação.

## Atendimento aos Requisitos

O projeto atende aos seguintes requisitos de negócio:

*   **API Gateway e Function Serverless**: Foi implementado um endpoint no API Gateway (`POST /cadastro`) que direciona as requisições para uma função Lambda (`cpf-cognito-lambda-handler`), responsável por toda a lógica de negócio.
*   **Integração com Sistema de Autenticação**: A solução utiliza o **Amazon Cognito** como sistema de autenticação para identificar e gerenciar os clientes.
*   **Identificação Apenas com CPF**: O cliente se identifica utilizando apenas o CPF. A função Lambda gera uma senha aleatória e forte no momento do cadastro no Cognito, mas essa senha não é exposta ou utilizada pelo cliente no fluxo de identificação inicial.
*   **Uso de JWT**: Após a identificação/cadastro, o Cognito gera um **JSON Web Token (JWT)** que é retornado ao cliente, permitindo que ele faça requisições autenticadas para outros serviços da aplicação.

## Principais Características

### Infraestrutura como Código (IaC)

A infraestrutura na AWS é criada e gerenciada através de scripts shell, facilitando a automação e a reprodutibilidade do ambiente.

**É fundamental configurar suas credenciais da AWS antes de executar os scripts.**

### Scripts do Projeto

*   `create-infrastructure.sh`:
    *   **Função**: Provisiona toda a infraestrutura necessária na AWS.
    *   **Recursos Criados**:
        *   Amazon Cognito User Pool (com schema personalizado para o CPF).
        *   Cognito App Client.
        *   IAM Role e Policy para a função Lambda.
        *   Função Lambda com o código da aplicação.
        *   API Gateway (HTTP API) com uma rota `POST /cadastro` integrada à Lambda.
    *   **Uso**: Execute `./create-infrastructure.sh` para criar o ambiente.

*   `cleanup.sh`:
    *   **Função**: Destrói **TODOS** os recursos criados pelo script `create-infrastructure.sh`.
    *   **Uso**: Execute `./cleanup.sh` para limpar o ambiente e evitar custos na AWS.

*   `deploy.sh`:
    *   **Função**: Empacota e atualiza o código da função Lambda sem precisar recriar toda a infraestrutura.
    *   **Uso**: Execute `./deploy.sh` após fazer alterações no código-fonte (arquivos em `src/`).

*   `diagnose-aws.sh`:
    *   **Função**: Executa uma série de verificações para diagnosticar problemas de conectividade e configuração com a AWS.
    *   **Uso**: Execute `./diagnose-aws.sh` se estiver enfrentando erros ao tentar se comunicar com a AWS.

### Validação de CPF

A validação do CPF segue as regras padrão:

*   O CPF deve conter 11 dígitos (caracteres não numéricos são removidos).
*   CPFs com todos os dígitos iguais são considerados **inválidos** (ex: `111.111.111-11`).
*   O cálculo dos dois dígitos verificadores é realizado para garantir a validade do número.

### Como Executar o Projeto

1.  **Configure suas credenciais da AWS**:
    ```bash
    aws configure
    ```
2.  **Torne os scripts executáveis**:
    ```bash
    chmod +x *.sh
    ```
3.  **Crie a infraestrutura**:
    ```bash
    ./create-infrastructure.sh
    ```
4.  **Teste a aplicação**:
    Ao final da execução do script de criação, uma URL do API Gateway será exibida. Use-a para testar:
    ```bash
    curl -X POST 'URL_DA_API_AQUI/cadastro' \
      -H 'Content-Type: application/json' \
      -d '{"cpf": "123.456.789-09"}' # Use um CPF válido
    ```

### Estrutura do Projeto
```
.
├── create-infrastructure.sh  # Script para criar a infraestrutura na AWS
├── cleanup.sh                # Script para limpar os recursos da AWS
├── deploy.sh                 # Script para fazer deploy de novas versões da Lambda
├── diagnose-aws.sh           # Script para diagnosticar problemas com a AWS
├── package.json              # Dependências do projeto
├── src/                      # Código-fonte da aplicação
│   ├── handlers/
│   │   └── cpfHandler.js     # Handler principal da Lambda
│   ├── services/
│   │   └── cognitoService.js # Lógica de interação com o Cognito
│   └── utils/
│       └── cpfValidator.js   # Funções de validação de CPF
└── test/                     # Testes da aplicação
    └── test.js
```
