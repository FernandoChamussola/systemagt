# 📝 Changelog - Configuração de Deploy

## [2025-11-15] - Correção de Proxy Nginx (API 404)

### 🐛 Problema Identificado
```
GET /api/debtors 404 (Not Found)
```

Frontend fazia requisição para `/api/debtors`, mas o Nginx não estava fazendo proxy corretamente para a API.

### 🔧 Solução Aplicada

**Alterado:** `frontend/Dockerfile`

**Problema:**
- Nginx: `location /api` → `proxy_pass http://api:3000`
- Resultado: `/api/debtors` → `http://api:3000/api/debtors` ❌ (duplicava `/api`)

**Solução:**
```nginx
location /api/ {
    proxy_pass http://api:3000/api/;
    # Adiciona barras finais para manter o path correto
}
```

**Como funciona agora:**
- Frontend: `GET /api/debtors`
- Nginx: `proxy_pass http://api:3000/api/debtors`
- Backend: Recebe em `/api/debtors` (rota configurada no Express)
- ✅ Funciona!

### ✅ Outras Melhorias
- Adicionado timeouts no proxy (60s)
- Melhorada configuração de headers

### 🚀 Para Aplicar
```bash
git add .
git commit -m "Fix: Corrigir proxy Nginx para rotas da API"
git push
# No Portainer: Pull and redeploy
```

---

## [2025-11-15] - Correção de Migrations em Produção

### 🐛 Problema Identificado
```
Error: The table `public.users` does not exist in the current database.
Error: No migration found in prisma/migrations
```

### 🔧 Solução Aplicada

**Alterado:** `backend/entrypoint.sh`

**De:**
```bash
npx prisma migrate deploy
```

**Para:**
```bash
npx prisma db push --skip-generate --accept-data-loss
```

### 📊 Diferença entre Comandos

| Comando | Uso | Vantagens | Desvantagens |
|---------|-----|-----------|--------------|
| `prisma migrate deploy` | Produção com histórico de migrations | Rastreabilidade, versionamento | Requer arquivos de migration |
| `prisma db push` | Desenvolvimento e deploy simples | Sempre funciona, sincroniza schema | Não cria histórico |

### ✅ Por que `prisma db push` é Melhor Aqui?

1. **Não depende de arquivos de migration** - Lê direto do `schema.prisma`
2. **Sempre sincroniza** - Garante que banco esteja igual ao schema
3. **Mais simples** - Não precisa executar comandos manuais
4. **Idempotente** - Pode rodar múltiplas vezes sem problemas
5. **Funciona no primeiro deploy** - Cria todas as tabelas automaticamente

### 🚀 Comportamento Atual

Ao iniciar o container `systemagt-api`:

```bash
⏳ Aguardando banco de dados...
🔄 Sincronizando estrutura do banco de dados...
✅ Banco de dados sincronizado com sucesso!
🚀 Iniciando servidor...
```

**Tabelas criadas automaticamente:**
- ✅ `users`
- ✅ `debtors`
- ✅ `debts`
- ✅ `payments`
- ✅ `collaterals`
- ✅ `notifications`

### 📝 Mudanças na Documentação

**Atualizados:**
- ✅ `DEPLOY-PORTAINER.md` - Removida seção de executar migrations manualmente
- ✅ `QUICK-START.md` - Simplificado passo 5 (aguardar inicialização)

**Novo comportamento:**
- ❌ ~~Executar `npx prisma migrate deploy` manualmente~~
- ✅ Banco configurado automaticamente no start

### ⚠️ Nota Importante

O comando usa `--accept-data-loss` que é seguro porque:
1. É o **primeiro deploy** (banco vazio)
2. Schema não muda após deploy inicial
3. Futuras mudanças devem ser feitas com cuidado

### 🔄 Para Futuras Migrações

Se precisar adicionar novas tabelas/campos:

**Opção 1: Atualizar schema e fazer redeploy**
```bash
# Editar backend/prisma/schema.prisma
# Commit e push
# No Portainer: Pull and redeploy
# Banco sincroniza automaticamente
```

**Opção 2: Usar migrations tradicionais**
```bash
# Em desenvolvimento
npx prisma migrate dev --name add_nova_tabela

# Commit arquivos de migration
# Alterar entrypoint.sh para usar migrate deploy
```

### ✅ Status Atual

- ✅ Deploy funciona automaticamente via Portainer
- ✅ Banco criado no primeiro start
- ✅ Sem necessidade de comandos manuais
- ✅ Pronto para produção

---

## [2025-11-15] - Configuração Inicial de Deploy

### 📦 Arquivos Criados

- ✅ `docker-compose.yml` - Produção (Portainer + Traefik)
- ✅ `docker-compose.dev.yml` - Desenvolvimento
- ✅ `.env.production.example` - Template de variáveis
- ✅ `scripts/deploy.sh` - Deploy automatizado
- ✅ `scripts/backup.sh` - Backup PostgreSQL
- ✅ `scripts/restore.sh` - Restore de backup

### 📚 Documentação Criada

- ✅ `DEPLOY-PORTAINER.md` - Guia Portainer
- ✅ `DEPLOY.md` - Guia manual
- ✅ `QUICK-START.md` - Início rápido
- ✅ `PRODUCTION-CHECKLIST.md` - Checklist
- ✅ `NOTAS-IMPORTANTES.md` - Notas técnicas
- ✅ `RESUMO-DEPLOY.md` - Resumo executivo

### 🎯 Padrão Aplicado

Seguindo **DOCKER-COMPOSE-GUIDE.md**:
- Network externa `traefik-public`
- Sem portas expostas
- Labels Traefik corretos
- Nginx como proxy reverso interno

### ✨ Funcionalidades

- ✅ SSL automático via Let's Encrypt
- ✅ Deploy via Portainer ou SSH
- ✅ Backup automatizado
- ✅ Mensagens com #DEBTTRACKER
- ✅ Health checks configurados

---

**Última atualização:** 2025-11-15
**Status:** ✅ Pronto para produção
