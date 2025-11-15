# ⚡ Quick Start - Deploy para Produção

## 📦 Arquivos Criados para Produção

- ✅ `docker-compose.yml` - Configuração de produção com Traefik (padrão Portainer)
- ✅ `.env.production.example` - Template de variáveis de ambiente
- ✅ `scripts/deploy.sh` - Script automatizado de deploy
- ✅ `scripts/backup.sh` - Script de backup do banco
- ✅ `scripts/restore.sh` - Script de restauração
- ✅ `DEPLOY-PORTAINER.md` - Documentação completa para Portainer
- ✅ `DEPLOY.md` - Documentação completa para deploy manual

## 🎯 Método 1: Deploy via Portainer (RECOMENDADO)

### 1️⃣ Acessar Portainer
```
https://portainer.seu-servidor.com
```

### 2️⃣ Criar Stack
- **Stacks** > **Add stack**
- **Name:** `systemagt`
- **Build method:** Repository
- **Repository URL:** `https://github.com/seu-usuario/systemagt`
- **Compose path:** `docker-compose.yml`

### 3️⃣ Configurar Variáveis
Adicionar variáveis de ambiente:
```env
POSTGRES_USER=systemagt_user
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_DB=systemagt_db
JWT_SECRET=SEU_JWT_SECRET_AQUI
WHATSAPP_API_URL=https://wtsapi.duckdns.org/enviar
```

**Gerar JWT Secret:**
```bash
openssl rand -base64 32
```

### 4️⃣ Deploy
Clique em **Deploy the stack**

### 5️⃣ Aguardar Inicialização
O banco de dados é configurado automaticamente!
Aguarde cerca de 30 segundos.

### 6️⃣ Acessar
```
https://systemagt.duckdns.org
```

📖 **Guia completo:** [DEPLOY-PORTAINER.md](./DEPLOY-PORTAINER.md)

---

## 🔧 Método 2: Deploy Manual via SSH

### 1️⃣ Na VPS - Clonar o repositório
```bash
cd /opt
git clone <seu-repositorio> systemagt
cd systemagt
```

### 2️⃣ Configurar variáveis de ambiente
```bash
cp .env.production.example .env
nano .env
```

**IMPORTANTE:** Configure estas variáveis:
```env
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
JWT_SECRET=$(openssl rand -base64 32)
```

### 3️⃣ Dar permissão aos scripts
```bash
chmod +x scripts/*.sh
```

### 4️⃣ Executar deploy
```bash
./scripts/deploy.sh
```

### 5️⃣ Verificar
```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f

# Acessar
https://systemagt.duckdns.org
```

📖 **Guia completo:** [DEPLOY.md](./DEPLOY.md)

## ✅ Pré-requisitos na VPS

- [ ] Docker e Docker Compose instalados
- [ ] Traefik rodando
- [ ] Rede `traefik-public` criada: `docker network create traefik-public`
- [ ] DNS `systemagt.duckdns.org` apontando para IP da VPS
- [ ] Portas 80 e 443 abertas

## 🔧 Comandos Úteis

```bash
# Atualizar sistema
git pull
./scripts/deploy.sh

# Fazer backup
./scripts/backup.sh

# Ver logs
docker compose logs -f

# Restart
docker compose restart

# Parar
docker compose stop

# Iniciar
docker compose start
```

## 🆘 Troubleshooting Rápido

### Containers não sobem
```bash
docker compose logs
```

### SSL não funciona
```bash
# Verificar Traefik
docker logs traefik

# Verificar DNS
nslookup systemagt.duckdns.org
```

### Banco não conecta
```bash
docker compose logs postgres
docker compose exec postgres psql -U systemagt_user -d systemagt_db
```

## 📚 Documentação Completa

Para mais detalhes, consulte: [DEPLOY.md](./DEPLOY.md)

## 🎉 Pronto!

Após o deploy, acesse: **https://systemagt.duckdns.org**

Credenciais: Crie uma nova conta no primeiro acesso.
