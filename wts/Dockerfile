FROM node:20-alpine

WORKDIR /app

# Instala dependencias do sistema para o Baileys
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copia package files
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia codigo fonte
COPY . .

# Cria diretorio para sessoes (multi-usuario)
RUN mkdir -p auth_sessions

# Volume para persistir sessoes
VOLUME ["/app/auth_sessions"]

EXPOSE 3002

CMD ["npm", "start"]
