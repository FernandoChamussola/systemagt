# 🚀 Guia de Deploy - SystemAGT

## 📋 Pré-requisitos

### Na VPS:
- Docker e Docker Compose instalados
- Traefik configurado e rodando (com certresolver=letsencrypt)
- Rede `traefik-public` criada
- DNS `systemagt.duckdns.org` apontando para o IP da VPS
- Portas 80 e 443 abertas no firewall

### Verificar Traefik:
```bash
docker ps | grep traefik
docker network ls | grep traefik-public
```

Se a rede não existir, criar com:
```bash
docker network create traefik-public
```

---

## 🔧 Configuração Inicial

### 1. Clone o repositório na VPS:
```bash
cd /opt  # ou pasta de sua preferência
git clone <seu-repositorio-git> systemagt
cd systemagt
```

### 2. Configure as variáveis de ambiente:
```bash
cp .env.production.example .env
nano .env
```

**Variáveis obrigatórias:**
```env
POSTGRES_USER=systemagt_user
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_DB=systemagt_db
JWT_SECRET=SEU_JWT_SECRET_AQUI_MIN_32_CHARS
WHATSAPP_API_URL=https://wtsapi.duckdns.org/enviar
DOMAIN=systemagt.duckdns.org
```

**Gerar JWT Secret seguro:**
```bash
openssl rand -base64 32
```

### 3. Configure permissões dos scripts:
```bash
chmod +x scripts/*.sh
```

---

## 🚀 Deploy Inicial

### Método 1: Script Automatizado (Recomendado)
```bash
./scripts/deploy.sh
```

### Método 2: Manual
```bash
# 1. Criar rede se necessário
docker network create traefik-public

# 2. Build das imagens
docker compose build --no-cache

# 3. Subir containers
docker compose up -d

# 4. Executar migrations
docker compose exec api npx prisma migrate deploy

# 5. Verificar status
docker compose ps
```

---

## 📊 Verificação do Deploy

### 1. Verificar containers rodando:
```bash
docker compose ps
```

Deve mostrar 3 containers:
- systemagt-postgres (healthy)
- systemagt-api (running)
- systemagt-frontend (running)

### 2. Ver logs:
```bash
# Todos os containers
docker compose logs -f

# Apenas API
docker compose logs -f api

# Apenas Frontend
docker compose logs -f frontend

# Apenas Postgres
docker compose logs -f postgres
```

### 3. Testar acesso:
```bash
# Testar API
curl https://systemagt.duckdns.org/api/health

# Acessar no navegador
https://systemagt.duckdns.org
```

### 4. Verificar SSL:
Acesse `https://systemagt.duckdns.org` e verifique o cadeado verde no navegador.

---

## 🔄 Atualizações

### Deploy de nova versão:
```bash
cd /opt/systemagt
git pull origin main
./scripts/deploy.sh
```

Ou manualmente:
```bash
git pull origin main
docker compose build --no-cache
docker compose up -d
docker compose exec api npx prisma migrate deploy
```

---

## 💾 Backup e Restauração

### Fazer backup manual:
```bash
./scripts/backup.sh
```

Os backups são salvos em `./backups/` com timestamp.

### Configurar backup automático (cron):
```bash
crontab -e
```

Adicionar linha para backup diário às 3h da manhã:
```cron
0 3 * * * cd /opt/systemagt && ./scripts/backup.sh >> /var/log/systemagt-backup.log 2>&1
```

### Restaurar backup:
```bash
# Listar backups disponíveis
ls -lh ./backups/

# Restaurar backup específico
./scripts/restore.sh ./backups/systemagt_backup_20250115_030000.sql.gz
```

---

## 🐛 Troubleshooting

### Containers não iniciam:
```bash
# Ver logs de erro
docker compose logs

# Restart completo
docker compose down
docker compose up -d
```

### Erro de conexão com banco:
```bash
# Verificar se postgres está healthy
docker compose ps postgres

# Ver logs do postgres
docker compose logs postgres

# Testar conexão manual
docker compose exec postgres psql -U systemagt_user -d systemagt_db
```

### SSL não funciona:
```bash
# Verificar logs do Traefik
docker logs traefik

# Verificar se o domínio resolve corretamente
nslookup systemagt.duckdns.org

# Verificar labels do container
docker inspect systemagt-frontend | grep traefik
```

### Migrations falhando:
```bash
# Executar manualmente
docker compose exec api npx prisma migrate deploy

# Ver status das migrations
docker compose exec api npx prisma migrate status

# Reset completo (CUIDADO: apaga dados!)
docker compose exec api npx prisma migrate reset
```

### Limpar tudo e recomeçar:
```bash
# ATENÇÃO: Isso apaga TODOS os dados!
docker compose down -v
docker compose up -d
docker compose exec api npx prisma migrate deploy
```

---

## 📁 Estrutura de Arquivos em Produção

```
/opt/systemagt/
├── backend/
│   ├── uploads/          # Arquivos de garantias (volume)
│   └── ...
├── frontend/
│   └── ...
├── backups/              # Backups do banco (volume)
│   └── systemagt_backup_*.sql.gz
├── scripts/
│   ├── deploy.sh         # Script de deploy
│   ├── backup.sh         # Script de backup
│   └── restore.sh        # Script de restauração
├── docker-compose.yml    # Configuração de produção
├── .env                  # Variáveis de ambiente (NÃO commitar!)
└── .env.production.example
```

---

## 🔐 Segurança

### Boas práticas:
1. **Nunca commitar o arquivo `.env`** com senhas reais
2. Use senhas fortes (min 20 caracteres)
3. Mantenha backups em local seguro
4. Monitore logs regularmente
5. Atualize as imagens Docker periodicamente

### Alterar senhas:
```bash
# 1. Atualizar .env com nova senha
nano .env

# 2. Restart containers
docker compose down
docker compose up -d
```

---

## 📊 Monitoramento

### Verificar uso de recursos:
```bash
# CPU e memória
docker stats

# Espaço em disco
df -h
du -sh /opt/systemagt/backups
```

### Logs importantes:
```bash
# Ver últimas 100 linhas
docker compose logs --tail=100

# Seguir logs em tempo real
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f api
```

---

## 🔄 Comandos Úteis

### Gerenciamento de containers:
```bash
# Parar todos os containers
docker compose stop

# Iniciar containers parados
docker compose start

# Restart completo
docker compose restart

# Remover containers (mantém volumes)
docker compose down

# Remover TUDO incluindo volumes (CUIDADO!)
docker compose down -v
```

### Executar comandos dentro dos containers:
```bash
# Acessar shell do container API
docker compose exec api sh

# Executar comando no postgres
docker compose exec postgres psql -U systemagt_user -d systemagt_db

# Ver variáveis de ambiente
docker compose exec api env
```

---

## 📞 Suporte

### Verificar versão:
```bash
cd /opt/systemagt
git log -1
docker compose version
```

### Coletar informações para debug:
```bash
# Salvar logs em arquivo
docker compose logs > debug-logs.txt

# Informações do sistema
docker compose ps > debug-status.txt
docker stats --no-stream >> debug-status.txt
```

---

## ✅ Checklist de Deploy

- [ ] DNS configurado e resolvendo corretamente
- [ ] Traefik rodando e rede traefik-public criada
- [ ] Arquivo .env configurado com senhas fortes
- [ ] Backup inicial criado
- [ ] Containers rodando (docker compose ps)
- [ ] Migrations executadas com sucesso
- [ ] Site acessível via HTTPS
- [ ] SSL funcionando (cadeado verde)
- [ ] Login e cadastro funcionando
- [ ] Notificações WhatsApp funcionando
- [ ] Backup automático configurado (cron)

---

## 🎉 Deploy Concluído!

Acesse: **https://systemagt.duckdns.org**

Para suporte ou issues: [GitHub Issues](https://github.com/seu-usuario/systemagt/issues)
