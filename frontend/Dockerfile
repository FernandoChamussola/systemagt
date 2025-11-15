FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'resolver 127.0.0.11 valid=30s ipv6=off; \
\
server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Permitir underscores em headers \
    underscores_in_headers on; \
    \
    # Aumentar tamanho máximo do body (para uploads) \
    client_max_body_size 50M; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        # Usar variável para forçar resolução DNS dinâmica \
        set $backend "http://api:3000"; \
        proxy_pass $backend/api/; \
        proxy_http_version 1.1; \
        \
        # Headers essenciais \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_set_header X-Forwarded-Host $host; \
        proxy_set_header X-Forwarded-Port $server_port; \
        \
        # CRÍTICO: Passar header Authorization \
        proxy_set_header Authorization $http_authorization; \
        proxy_pass_header Authorization; \
        \
        # Headers para WebSocket/Upgrade \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        \
        # Timeouts \
        proxy_connect_timeout 60s; \
        proxy_send_timeout 60s; \
        proxy_read_timeout 60s; \
        \
        # Buffering (importante para POST) \
        proxy_buffering off; \
        proxy_request_buffering off; \
        \
        # Keepalive e retries \
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503; \
        proxy_next_upstream_tries 2; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
