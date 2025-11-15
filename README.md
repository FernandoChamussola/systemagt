# Sistema de Gestão de Devedores

Sistema completo para gestão de devedores, dívidas e cobranças automáticas via WhatsApp.

## 🚀 FASES CONCLUÍDAS

### ✅ FASE 1 - Autenticação
- Backend (Node.js + TypeScript + Express + Prisma + PostgreSQL)
- Sistema de autenticação JWT
- Registro de usuários e Login/Logout
- Frontend (React + Vite + TailwindCSS + Shadcn/ui)
- Telas de Login e Registro com design moderno
- Tema escuro por padrão
- Proteção de rotas
- Docker Compose para desenvolvimento

### ✅ FASE 2 - Gestão de Devedores
- CRUD completo de devedores
- Validação de telefone (prefixo +258)
- Lista responsiva com ações
- Página de detalhes com histórico

### ✅ FASE 3 - Gestão de Dívidas
- CRUD de dívidas com cálculo automático de juros
- Sistema de pagamentos parciais e totais
- Status automático (PENDENTE, ATRASADO, PAGO)
- Filtros por status
- Histórico de pagamentos

### ✅ FASE 4 - Upload de Garantias
- Upload de fotos e documentos
- Preview de imagens
- Download de arquivos
- Galeria responsiva

### ✅ FASE 5 - Dashboard e Estatísticas
- Painel com métricas financeiras completas
- Cards de estatísticas (devedores, emprestado, a receber, em atraso)
- Lista de dívidas próximas ao vencimento (7 dias)
- Lista de dívidas atrasadas (top 5)
- Navegação rápida
- Design responsivo

### ✅ FASE 6 - Sistema de Notificações WhatsApp
- Integração com WhatsApp API (wtsapi.duckdns.org)
- Notificações automáticas via cron job (diário às 9h)
- Envio manual de notificações
- Histórico completo de notificações
- Mensagens personalizadas com #DEBTTRACKER
- Resumo diário para usuários
- Status de envio (ENVIADO/FALHOU)

### ✅ FASE 7 - Relatórios e Exportação
- Geração de relatórios em PDF e Excel
- Relatório geral do sistema
- Relatório individual por devedor
- Relatório de múltiplos devedores
- Exportação de dados completos

## 🧪 Como testar localmente

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd systemagt
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

### 3. Suba os containers
```bash
docker compose -f docker-compose.dev.yml up --build
```

### 4. Acesse o sistema
```
Frontend: http://localhost
API: http://localhost:3000
```

### 5. Teste o fluxo:
1. Acesse http://localhost
2. Clique em "Criar conta"
3. Preencha os dados e registre-se
4. Você será redirecionado para o Dashboard
5. Faça logout e tente fazer login novamente

## 🚀 Deploy em Produção

O sistema está pronto para produção!

### 🎯 Método Recomendado: Portainer

**Guia completo:** [DEPLOY-PORTAINER.md](./DEPLOY-PORTAINER.md)

**Deploy em 6 passos:**
1. Acessar Portainer
2. Criar Stack (Repository: GitHub)
3. Configurar variáveis de ambiente
4. Deploy
5. Executar migrations
6. Acessar sistema

### 🔧 Método Alternativo: Deploy Manual

**Guia completo:** [DEPLOY.md](./DEPLOY.md)

```bash
cd /opt
git clone <repositorio> systemagt
cd systemagt
cp .env.production.example .env
nano .env  # Configurar senhas
./scripts/deploy.sh
```

### 📋 Documentação de Deploy

- **[QUICK-START.md](./QUICK-START.md)** - Início rápido (5 minutos)
- **[DEPLOY-PORTAINER.md](./DEPLOY-PORTAINER.md)** - Deploy via Portainer (recomendado)
- **[DEPLOY.md](./DEPLOY.md)** - Deploy manual via SSH
- **[PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)** - Checklist completo
- **[NOTAS-IMPORTANTES.md](./NOTAS-IMPORTANTES.md)** - Notas técnicas importantes

### 🌐 Acesso em Produção

- **URL:** https://systemagt.duckdns.org
- **SSL:** Certificado automático via Let's Encrypt (Traefik)

### ✨ Características

- ✅ Docker Compose otimizado para produção (padrão Portainer + Traefik)
- ✅ SSL/TLS automático via Let's Encrypt
- ✅ Sem portas expostas (segurança)
- ✅ Backup automatizado do banco de dados
- ✅ Scripts de deploy facilitados
- ✅ Monitoramento via Portainer/logs
- ✅ Network externa (traefik-public)
- ✅ Nginx como proxy reverso interno

## 🛠️ Stack Tecnológica

**Backend:**
- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT + Bcrypt

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Shadcn/ui
- React Router
- Axios

**DevOps:**
- Docker + Docker Compose
- Nginx

## 📝 Comandos úteis

```bash
# Parar os containers
docker compose -f docker-compose.dev.yml down

# Ver logs
docker compose -f docker-compose.dev.yml logs -f

# Reconstruir os containers
docker compose -f docker-compose.dev.yml up --build

# Limpar tudo (incluindo dados do banco)
docker compose -f docker-compose.dev.yml down -v
```

## 🎨 Design

O sistema possui:
- Tema escuro por padrão
- Interface moderna e responsiva
- Componentes do Shadcn/ui
- Animações suaves
- Ícones do Lucide React
- Gradientes e sombras elegantes

## 📞 Suporte

Em caso de dúvidas, consulte o arquivo `ROTEIRO-DESENVOLVIMENTO.md` para ver o planejamento completo.
