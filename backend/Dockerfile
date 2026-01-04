FROM node:18-alpine AS builder

WORKDIR /app

# Instalar OpenSSL 3 e wget para compatibilidade com Prisma e healthcheck
RUN apk add --no-cache openssl openssl-dev wget

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL 3 e wget na imagem final
RUN apk add --no-cache openssl openssl-dev wget

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]