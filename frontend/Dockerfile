FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Configuração para SPA \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy para API com suporte completo a CORS \
    location /api/ { \
        # Tratar requisições OPTIONS (preflight) \
        if ($request_method = OPTIONS) { \
            add_header Access-Control-Allow-Origin $http_origin always; \
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always; \
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always; \
            add_header Access-Control-Max-Age 86400 always; \
            add_header Access-Control-Allow-Credentials true always; \
            add_header Content-Length 0; \
            add_header Content-Type text/plain; \
            return 204; \
        } \
        \
        proxy_pass http://api:3000/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_set_header Connection ""; \
        \
        # Headers CORS para requisições normais \
        add_header Access-Control-Allow-Origin $http_origin always; \
        add_header Access-Control-Allow-Credentials true always; \
        \
        # Timeouts \
        proxy_connect_timeout 60s; \
        proxy_send_timeout 60s; \
        proxy_read_timeout 60s; \
        \
        # Buffer settings \
        proxy_buffering off; \
        proxy_request_buffering off; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
