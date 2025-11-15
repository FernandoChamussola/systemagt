FROM node:18-alpine AS builder

WORKDIR /app

# Instalar OpenSSL 3 para compatibilidade com Prisma
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL 3 na imagem final
RUN apk add --no-cache openssl openssl-dev

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

CMD ["./entrypoint.sh"]
