# Dockerfile de Produção para Jogo da Velha Multiplayer
FROM node:22-alpine AS builder

WORKDIR /app

# Copia dependências
COPY package*.json ./
RUN npm ci

# Copia código-fonte e compila frontend
COPY . .
RUN npm run build

# Imagem final de execução
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# Copia build e arquivos do servidor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/game ./src/game
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "server.ts"]
