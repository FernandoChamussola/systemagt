# 🔧 Guia de Proxy Nginx - SystemAGT

## 🎯 Problema Comum: Roteamento de API

### ❌ Configuração Incorreta

```nginx
location /api {
    proxy_pass http://api:3000;
}
```

**Resultado:**
- Request: `GET /api/debtors`
- Nginx envia: `GET http://api:3000/api/debtors`
- Se backend espera `/api/debtors` → ✅ Funciona
- Se backend espera `/debtors` → ❌ 404

---

### ✅ Configuração Correta para SystemAGT

```nginx
location /api/ {
    proxy_pass http://api:3000/api/;
}
```

**Por quê?**
- Backend tem rotas: `app.use('/api/debtors', ...)`
- Frontend chama: `GET /api/debtors`
- Nginx mantém: `GET http://api:3000/api/debtors`
- ✅ Tudo funciona!

---

## 📊 Entendendo as Barras

### Sem Barra Final (Remove Prefixo)

```nginx
location /api/ {
    proxy_pass http://api:3000/;
    #                         ^ Barra aqui remove /api
}
```

**Comportamento:**
- Request: `/api/debtors`
- Remove `/api`: `/debtors`
- Proxy: `http://api:3000/debtors`

**Usar quando:** Backend não tem prefixo `/api` nas rotas.

---

### Com Barra Final (Mantém Path Completo)

```nginx
location /api/ {
    proxy_pass http://api:3000/api/;
    #                         ^ Path completo
}
```

**Comportamento:**
- Request: `/api/debtors`
- Mantém tudo: `/api/debtors`
- Proxy: `http://api:3000/api/debtors`

**Usar quando:** Backend tem prefixo `/api` nas rotas. ✅ (SystemAGT)

---

## 🧪 Exemplos Práticos

### Cenário 1: Backend com /api (SystemAGT)

**Backend:**
```javascript
app.use('/api/auth', authRoutes);      // /api/auth/*
app.use('/api/debtors', debtorRoutes); // /api/debtors/*
```

**Nginx Correto:**
```nginx
location /api/ {
    proxy_pass http://api:3000/api/;
}
```

**Teste:**
```
Frontend → /api/auth/login
Nginx    → http://api:3000/api/auth/login
Backend  → ✅ Encontra rota /api/auth/login
```

---

### Cenário 2: Backend sem /api

**Backend:**
```javascript
app.use('/auth', authRoutes);      // /auth/*
app.use('/debtors', debtorRoutes); // /debtors/*
```

**Nginx Correto:**
```nginx
location /api/ {
    proxy_pass http://api:3000/;
}
```

**Teste:**
```
Frontend → /api/auth/login
Nginx    → http://api:3000/auth/login (remove /api)
Backend  → ✅ Encontra rota /auth/login
```

---

## ⚙️ Configuração Completa do SystemAGT

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Aumentar limite do body (para uploads)
    client_max_body_size 50M;

    # Frontend (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://api:3000/api/;
        proxy_http_version 1.1;

        # Headers essenciais
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Headers para WebSocket/Upgrade
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts (importante para uploads e operações longas)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering (CRÍTICO para POST funcionar corretamente)
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

---

## 🐛 Troubleshooting

### POST Funciona na Segunda Tentativa

**Sintoma:**
```
POST /api/auth/register → 404 (primeira vez)
POST /api/auth/register → 200 OK (segunda vez)
```

**Causa:** Nginx buffering está atrasando a requisição

**Solução:**
```nginx
location /api/ {
    proxy_pass http://api:3000/api/;

    # Desabilitar buffering
    proxy_buffering off;
    proxy_request_buffering off;
}
```

---

### POST Retorna 413 Request Entity Too Large

**Sintoma:**
```
POST /api/collaterals → 413 (Request Entity Too Large)
```

**Causa:** Body da requisição maior que o limite do Nginx

**Solução:**
```nginx
server {
    # Aumentar limite (padrão é 1M)
    client_max_body_size 50M;
}
```

---

### 404 Not Found

**Sintoma:**
```
GET /api/debtors 404 (Not Found)
```

**Verificar:**
1. **Logs do Nginx:**
   ```bash
   docker logs systemagt-frontend | grep api
   ```

2. **Logs do Backend:**
   ```bash
   docker logs systemagt-api | grep debtors
   ```

3. **Testar diretamente na API:**
   ```bash
   docker exec systemagt-api curl http://localhost:3000/api/debtors
   ```

**Soluções:**
- ✅ Verificar se `proxy_pass` tem barra final correta
- ✅ Verificar se rotas do backend têm `/api` ou não
- ✅ Conferir nome do serviço (`api` vs `systemagt-api`)

---

### 502 Bad Gateway

**Sintoma:**
```
GET /api/debtors 502 (Bad Gateway)
```

**Causas:**
1. Container `api` não está rodando
2. Container `api` não responde na porta 3000
3. Não estão na mesma network

**Verificar:**
```bash
# API rodando?
docker ps | grep systemagt-api

# Mesma network?
docker inspect systemagt-api | grep -A5 Networks
docker inspect systemagt-frontend | grep -A5 Networks

# API responde?
docker exec systemagt-api curl http://localhost:3000/health
```

---

### 504 Gateway Timeout

**Sintoma:**
```
GET /api/reports/pdf 504 (Gateway Timeout)
```

**Causa:** Operação demora muito (ex: gerar PDF)

**Solução:**
```nginx
location /api/ {
    proxy_pass http://api:3000/api/;

    # Aumentar timeouts
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

---

## 📝 Checklist de Configuração

Antes de fazer deploy, verificar:

- [ ] `location /api/` tem barra final
- [ ] `proxy_pass` tem barra final se backend tem `/api`
- [ ] Nome do serviço correto (`api` não `systemagt-api`)
- [ ] Timeouts configurados (min 60s)
- [ ] Headers de proxy configurados
- [ ] Testado localmente com docker-compose

---

## 🔍 Como Testar

### 1. Testar localmente

```bash
# Subir ambiente dev
docker compose -f docker-compose.dev.yml up -d

# Testar proxy
curl http://localhost/api/health

# Ver logs
docker logs devedores-frontend-dev
```

### 2. Testar em produção

```bash
# Verificar configuração do Nginx
docker exec systemagt-frontend cat /etc/nginx/conf.d/default.conf

# Testar interno (dentro do container)
docker exec systemagt-frontend curl http://api:3000/api/health

# Testar externo
curl https://systemagt.duckdns.org/api/health
```

---

## 🎯 Regra de Ouro

**Se backend tem `/api` nas rotas:**
```nginx
location /api/ {
    proxy_pass http://api:3000/api/;
}
```

**Se backend NÃO tem `/api` nas rotas:**
```nginx
location /api/ {
    proxy_pass http://api:3000/;
}
```

**SystemAGT usa a primeira opção!** ✅

---

**Última atualização:** 2025-11-15
**Status:** ✅ Testado e funcionando
