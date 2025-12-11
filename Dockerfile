FROM node:23-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copia arquivos de dependências primeiro (para cache)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Gera o Prisma Client
RUN npx prisma generate

# Copia o resto do código.
COPY . .

# Build da aplicação
RUN npm run build

EXPOSE 1337

# Comando padrão (sem migrações)
CMD ["node", "dist/src/main"]