# ⚠️ NOTAS IMPORTANTES - SystemAGT

## 🎯 Padrão de Deploy (Portainer + Traefik)

Este projeto segue o padrão estabelecido no **DOCKER-COMPOSE-GUIDE.md**

### ✅ Configurações Corretas

#### 1. docker-compose.yml (Produção)
```yaml
# ✅ CORRETO - SEM PORTAS EXPOSTAS
services:
  postgres:
    networks:
      - traefik-public
    # NÃO tem "ports:" - PostgreSQL fica interno

  api:
    networks:
      - traefik-public
    # NÃO tem "ports:" - API fica interna

  frontend:
    networks:
      - traefik-public
    # NÃO tem "ports:" - Traefik gerencia
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.systemagt.rule=Host(`systemagt.duckdns.org`)"
      - "traefik.http.routers.systemagt.entrypoints=websecure"
      - "traefik.http.routers.systemagt.tls.certresolver=letsencrypt"
      - "traefik.http.services.systemagt.loadbalancer.server.port=80"

networks:
  traefik-public:
    external: true  # ← CRÍTICO: sempre external
```

#### 2. Dockerfile do Frontend (Nginx)
```dockerfile
# ✅ CORRETO - USA NOME DO SERVIÇO
location /api {
    proxy_pass http://api:3000;  # ← "api" é o nome do SERVIÇO
    # NÃO usar "systemagt-api" (nome do container)
    # NÃO usar "localhost:3000"
}
```

---

## ❌ ERROS COMUNS A EVITAR

### 1. Expor Portas em Produção
```yaml
# ❌ ERRADO - NÃO FAZER
services:
  api:
    ports:
      - "3000:3000"  # ← Remove isso em produção
```

**Por quê?** Traefik gerencia todo o acesso via labels.

---

### 2. Nome Errado no proxy_pass
```dockerfile
# ❌ ERRADO
proxy_pass http://systemagt-api:3000;  # ← Nome do container

# ❌ ERRADO
proxy_pass http://localhost:3000;  # ← Não funciona no Docker

# ✅ CORRETO
proxy_pass http://api:3000;  # ← Nome do SERVIÇO
```

**Sempre use o nome do SERVIÇO no docker-compose.yml!**

---

### 3. Network Não Externa
```yaml
# ❌ ERRADO
networks:
  traefik-public:
    driver: bridge

# ✅ CORRETO
networks:
  traefik-public:
    external: true  # ← Network criada externamente
```

---

### 4. Esquecer de Criar Network
```bash
# ❌ Erro: "network traefik-public not found"

# ✅ SOLUÇÃO: Criar network antes do deploy
docker network create traefik-public
```

---

### 5. Labels do Traefik Incorretos
```yaml
# ❌ ERRADO - Domínio errado
- "traefik.http.routers.systemagt.rule=Host(`localhost`)"

# ❌ ERRADO - Porta errada
- "traefik.http.services.systemagt.loadbalancer.server.port=3000"

# ✅ CORRETO
- "traefik.http.routers.systemagt.rule=Host(`systemagt.duckdns.org`)"
- "traefik.http.services.systemagt.loadbalancer.server.port=80"
```

---

## 📋 Diferenças Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Arquivo** | docker-compose.dev.yml | docker-compose.yml |
| **Portas** | Expostas (80, 3000, 5432) | NÃO expostas |
| **Network** | Default (bridge) | traefik-public (external) |
| **SSL** | Não | Sim (via Traefik) |
| **Domínio** | localhost | systemagt.duckdns.org |
| **Labels Traefik** | Não | Sim |
| **NODE_ENV** | development | production |

---

## 🔍 Verificações Antes do Deploy

### 1. Docker Compose Correto
```bash
# Verificar que NÃO tem "ports:" em produção
grep -n "ports:" docker-compose.yml
# Deve retornar vazio ou apenas comentários

# Verificar network externa
grep -A2 "networks:" docker-compose.yml | grep "external: true"
# Deve retornar a linha
```

### 2. Nginx Proxy Pass Correto
```bash
# Verificar nome do serviço
grep "proxy_pass" frontend/Dockerfile
# Deve mostrar: http://api:3000
```

### 3. Variáveis de Ambiente
```bash
# Verificar .env não está no Git
git ls-files | grep "^.env$"
# Deve retornar vazio

# Verificar .env.example existe
ls -la .env.example .env.production.example
```

---

## 🚀 Fluxo de Deploy Correto

### Via Portainer (Recomendado):
1. Stacks > Add Stack
2. Repository: GitHub URL
3. Compose path: `docker-compose.yml`
4. Environment Variables: Adicionar todas
5. Deploy
6. Console do container API: `npx prisma migrate deploy`

### Via SSH:
1. Clone repositório
2. Copiar `.env.production.example` para `.env`
3. Configurar variáveis
4. `./scripts/deploy.sh`
5. Executar migrations

---

## 🐛 Troubleshooting Rápido

### Site não carrega (502 Bad Gateway)
```bash
# 1. Verificar containers rodando
docker ps | grep systemagt

# 2. Ver logs do Traefik
docker logs traefik | grep systemagt

# 3. Verificar DNS
nslookup systemagt.duckdns.org

# 4. Verificar labels
docker inspect systemagt-frontend | grep traefik
```

### "network traefik-public not found"
```bash
docker network create traefik-public
```

### "host not found in upstream api"
```bash
# Verificar Dockerfile do frontend
grep proxy_pass frontend/Dockerfile
# Deve ser: http://api:3000 (nome do serviço)
```

### API não conecta ao banco
```bash
# 1. Verificar se postgres está healthy
docker ps | grep postgres

# 2. Ver logs
docker logs systemagt-postgres

# 3. Testar conexão
docker exec -it systemagt-postgres psql -U systemagt_user -d systemagt_db
```

---

## 📝 Checklist de Configuração

Antes de fazer deploy, verificar:

- [ ] `docker-compose.yml` **SEM** "ports" (apenas frontend se necessário)
- [ ] `docker-compose.yml` usa `networks: traefik-public` com `external: true`
- [ ] Labels do Traefik corretos (domínio, entrypoint, tls)
- [ ] `frontend/Dockerfile` usa nome do **SERVIÇO** para proxy_pass
- [ ] `.env` **NÃO** está no Git
- [ ] `.env.example` **ESTÁ** no Git
- [ ] Network `traefik-public` criada na VPS
- [ ] Traefik rodando na VPS
- [ ] DuckDNS apontando para IP da VPS
- [ ] Portainer acessível (se usar)

---

## 🔐 Segurança

### Senhas Fortes
```bash
# Gerar senha PostgreSQL (20+ caracteres)
openssl rand -base64 24

# Gerar JWT Secret (32+ caracteres)
openssl rand -base64 32
```

### Nunca Commitar
- ❌ `.env` com senhas reais
- ❌ Backups do banco (*.sql, *.sql.gz)
- ❌ Uploads de usuários
- ❌ Volumes Docker

### Sempre Commitar
- ✅ `.env.example` (sem senhas)
- ✅ `.env.production.example` (sem senhas)
- ✅ `docker-compose.yml`
- ✅ `docker-compose.dev.yml`
- ✅ Documentação

---

## 📚 Documentação

- **DEPLOY-PORTAINER.md** - Deploy via Portainer (passo a passo)
- **DEPLOY.md** - Deploy manual via SSH
- **QUICK-START.md** - Início rápido
- **PRODUCTION-CHECKLIST.md** - Checklist completo
- **DOCKER-COMPOSE-GUIDE.md** - Guia definitivo (referência)

---

## 🎯 Lições Aprendidas

### 1. Nome do Serviço ≠ Nome do Container
```yaml
services:
  api:  # ← Nome do SERVIÇO (usar no proxy_pass)
    container_name: systemagt-api  # ← Nome do CONTAINER (não usar)
```

### 2. Produção Não Expõe Portas
- Traefik acessa containers via network interna
- Apenas labels definem o roteamento
- Mais seguro (menos superfície de ataque)

### 3. Network Externa É Obrigatória
- Traefik e containers devem estar na mesma network
- Network deve ser criada ANTES do deploy
- `docker network create traefik-public`

### 4. Migrations Devem Ser Executadas
- Após primeiro deploy: `npx prisma migrate deploy`
- Via console do Portainer ou SSH
- Necessário para criar tabelas do banco

---

## ✨ Teste Final

Após deploy, testar:

1. ✅ `https://systemagt.duckdns.org` carrega
2. ✅ Cadeado verde (SSL funcionando)
3. ✅ Consegue criar conta
4. ✅ Consegue fazer login
5. ✅ Dashboard carrega
6. ✅ CRUD de devedores funciona
7. ✅ CRUD de dívidas funciona
8. ✅ Upload de garantias funciona
9. ✅ Notificações WhatsApp funcionam

---

**Última atualização:** 2025-11-15
**Baseado em:** DOCKER-COMPOSE-GUIDE.md
**Status:** ✅ Testado e funcionando
