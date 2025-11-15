# 🚀 Deploy SystemAGT via Portainer

## 📋 Pré-requisitos

### Na VPS:
- ✅ Docker e Docker Compose instalados
- ✅ **Portainer** instalado e rodando
- ✅ **Traefik** rodando (com certresolver=letsencrypt)
- ✅ Rede `traefik-public` criada
- ✅ DNS `systemagt.duckdns.org` apontando para IP da VPS
- ✅ Portas 80 e 443 abertas no firewall

### Verificar Infraestrutura:
```bash
# Verificar Traefik
docker ps | grep traefik

# Verificar Portainer
docker ps | grep portainer

# Verificar rede
docker network ls | grep traefik-public
```

**Se a rede não existir:**
```bash
docker network create traefik-public
```

---

## 🎯 Deploy em 7 Passos

### 1️⃣ Acessar Portainer

Acesse seu Portainer:
```
https://portainer.seu-servidor.com
```

Faça login com suas credenciais.

---

### 2️⃣ Criar Nova Stack

1. No menu lateral, clique em **Stacks**
2. Clique no botão **+ Add stack**

---

### 3️⃣ Configurar Repositório

Preencha os campos:

- **Name:** `systemagt`
- **Build method:** Selecione `Repository`
- **Repository URL:** `https://github.com/seu-usuario/systemagt`
- **Repository reference:** `refs/heads/main`
- **Compose path:** `docker-compose.yml`
- **Skip TLS verification:** ❌ (deixar desmarcado)

---

### 4️⃣ Configurar Variáveis de Ambiente

Clique em **Add an environment variable** e adicione:

| Name | Value |
|------|-------|
| `POSTGRES_USER` | `systemagt_user` |
| `POSTGRES_PASSWORD` | Sua senha forte aqui |
| `POSTGRES_DB` | `systemagt_db` |
| `JWT_SECRET` | Seu JWT secret aqui |
| `WHATSAPP_API_URL` | `https://wtsapi.duckdns.org/enviar` |

**Gerar JWT Secret seguro:**
```bash
openssl rand -base64 32
```

⚠️ **IMPORTANTE:** Use senhas FORTES (mínimo 20 caracteres)

---

### 5️⃣ Deploy

1. Revise as configurações
2. Clique em **Deploy the stack**
3. Aguarde o processo de build (pode levar alguns minutos)

O Portainer irá:
- ✅ Clonar o repositório automaticamente
- ✅ Fazer build das imagens Docker
- ✅ Subir os containers
- ✅ Conectar ao Traefik
- ✅ Gerar certificado SSL automático

---

### 6️⃣ Verificar Status

1. No menu lateral, clique em **Containers**
2. Verifique se todos os containers estão rodando:

| Container | Status | Health |
|-----------|--------|--------|
| systemagt-postgres | ▶️ Running | 💚 Healthy |
| systemagt-api | ▶️ Running | - |
| systemagt-frontend | ▶️ Running | - |

---

### 7️⃣ Executar Migrations do Banco

1. Clique no container **systemagt-api**
2. Clique na aba **Console**
3. Clique em **Connect**
4. Execute o comando:

```bash
npx prisma migrate deploy
```

Aguarde até ver a mensagem de sucesso.

---

## ✅ Verificação do Deploy

### 1. Testar Acesso ao Site:

Acesse no navegador:
```
https://systemagt.duckdns.org
```

Deve carregar a página de login do sistema.

### 2. Verificar Certificado SSL:

- Cadeado verde deve aparecer no navegador
- Certificado válido do Let's Encrypt

### 3. Testar API:

```bash
curl https://systemagt.duckdns.org/api/health
```

### 4. Ver Logs:

No Portainer:
1. Clique em **Containers**
2. Clique em um container
3. Clique na aba **Logs**

Ou via SSH:
```bash
docker logs systemagt-api -f
docker logs systemagt-frontend -f
```

---

## 🔄 Atualizar o Sistema

### Quando houver atualizações no código:

1. Acesse **Portainer** > **Stacks** > **systemagt**
2. Clique em **Pull and redeploy**
3. Confirme a ação
4. Aguarde o rebuild

Ou via Git webhook (configuração avançada):
- Configure webhook no GitHub
- Configure webhook no Portainer
- Push automático faz redeploy

---

## 📦 Backup

### Fazer Backup Manual:

1. Acesse o container postgres via console:
```bash
docker exec -t systemagt-postgres pg_dump -U systemagt_user -d systemagt_db > backup.sql
```

2. Baixar backup via Portainer:
   - **Containers** > **systemagt-postgres** > **Volumes**
   - Acesse `/backups`

### Backup Automático:

Configure um cron job na VPS:
```bash
crontab -e
```

Adicione:
```
0 3 * * * docker exec systemagt-postgres pg_dump -U systemagt_user -d systemagt_db | gzip > /opt/backups/systemagt_$(date +\%Y\%m\%d).sql.gz
```

---

## 🐛 Troubleshooting

### Container não inicia:

1. Ver logs no Portainer
2. Verificar variáveis de ambiente
3. Verificar se rede `traefik-public` existe

### Site não carrega (502 Bad Gateway):

1. Verificar se containers estão rodando
2. Ver logs do Traefik: `docker logs traefik`
3. Verificar DNS: `nslookup systemagt.duckdns.org`

### SSL não funciona:

1. Verificar logs do Traefik
2. Verificar se domínio aponta para IP correto
3. Verificar labels do docker-compose.yml

### Banco não conecta:

1. Ver logs do postgres: `docker logs systemagt-postgres`
2. Verificar variáveis de ambiente (POSTGRES_PASSWORD)
3. Verificar se postgres está healthy

### Migrations falhando:

```bash
# Conectar no container API
docker exec -it systemagt-api sh

# Verificar status das migrations
npx prisma migrate status

# Executar migrations
npx prisma migrate deploy
```

---

## 🔧 Configurações Avançadas

### Aumentar recursos do container:

No Portainer:
1. **Containers** > **systemagt-api** > **Duplicate/Edit**
2. **Resources** > Ajustar CPU/Memory limits
3. **Deploy**

### Configurar logs rotation:

Editar a stack e adicionar:
```yaml
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 📊 Monitoramento

### Ver estatísticas de recursos:

```bash
docker stats systemagt-postgres systemagt-api systemagt-frontend
```

No Portainer:
- **Containers** > Ver gráficos de CPU/Memory

---

## 🎯 Checklist Final

- [ ] Portainer acessível
- [ ] Stack `systemagt` criada
- [ ] Variáveis de ambiente configuradas
- [ ] Containers rodando (verde)
- [ ] Migrations executadas
- [ ] Site acessível via HTTPS
- [ ] SSL funcionando (cadeado verde)
- [ ] Login funcionando
- [ ] Backup configurado

---

## 📞 Suporte

### Logs importantes:
```bash
# Ver todos os logs
docker compose logs

# Logs específicos
docker logs systemagt-api --tail 100
docker logs systemagt-postgres --tail 100
docker logs traefik --tail 100
```

### Restart containers:
No Portainer:
1. **Containers** > Selecionar container
2. **Restart**

---

## 🎉 Deploy Concluído!

✅ Sistema rodando em: **https://systemagt.duckdns.org**

✅ SSL automático via Let's Encrypt

✅ Gerenciamento fácil via Portainer

✅ Backups configurados

**Pronto para usar! 🚀**
