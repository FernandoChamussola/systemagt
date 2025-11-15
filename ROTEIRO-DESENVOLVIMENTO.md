# 📋 ROTEIRO COMPLETO - SISTEMA DE GESTÃO DE DEVEDORES

## 🎯 Metodologia
Cada fase será desenvolvida **Back-end → Front-end → Teste → Aprovação** antes de avançar.

---

## 🔥 FASE 1: SETUP INICIAL + AUTENTICAÇÃO
**Objetivo:** Estrutura base do projeto + Login/Registro funcionando

### Back-end (API):
- ✅ Setup do projeto Node.js + TypeScript + Express
- ✅ Configuração do Prisma + PostgreSQL
- ✅ Modelo de dados: `User`
- ✅ Endpoints:
  - `POST /api/auth/register` (criar conta)
  - `POST /api/auth/login` (fazer login → retorna JWT)
  - `GET /api/auth/me` (pegar dados do usuário logado)
  - `POST /api/auth/logout` (invalidar token)
- ✅ Middleware de autenticação JWT
- ✅ Dockerfile do backend

### Front-end:
- ✅ Setup React + Vite + TailwindCSS + Shadcn/ui
- ✅ Tema escuro por padrão
- ✅ Páginas:
  - Tela de Login
  - Tela de Registro
  - Proteção de rotas (redirect se não autenticado)
- ✅ Integração com API de auth
- ✅ Armazenamento do JWT (localStorage)
- ✅ Dockerfile do frontend (Nginx com proxy)

### Docker:
- ✅ `docker-compose.dev.yml` (PostgreSQL + API + Frontend)
- ✅ `.env.example`

### 🧪 Teste da Fase 1:
```
1. Subir: docker compose -f docker-compose.dev.yml up --build
2. Acessar: http://localhost
3. Criar conta
4. Fazer login
5. Ver que está autenticado
6. Fazer logout
```

**✋ CHECKPOINT:** Você testa e aprova antes de seguir.

---

## 🔥 FASE 2: GESTÃO DE CLIENTES/DEVEDORES
**Objetivo:** CRUD completo de devedores

### Back-end:
- ✅ Modelo de dados: `Debtor` (nome, telefone +258, localização, descrição, outros_telefones, ativo)
- ✅ Endpoints protegidos (requer JWT):
  - `POST /api/debtors` (criar devedor)
  - `GET /api/debtors` (listar devedores do usuário)
  - `GET /api/debtors/:id` (ver detalhes de um devedor)
  - `PUT /api/debtors/:id` (editar devedor)
  - `DELETE /api/debtors/:id` (soft delete - marcar ativo=false)
- ✅ Validação de telefone (prefixo 258)

### Front-end:
- ✅ Página: **Lista de Devedores**
  - Tabela responsiva
  - Botão "Novo Devedor"
  - Ações: Editar, Deletar, Ver Detalhes
- ✅ Modal/Página: **Cadastrar Devedor**
  - Formulário com validação
  - Campos: nome, telefone +258, localização, descrição, outros telefones
- ✅ Modal/Página: **Editar Devedor**
- ✅ Modal/Página: **Detalhes do Devedor**
- ✅ Confirmação antes de deletar

### 🧪 Teste da Fase 2:
```
1. Criar vários devedores
2. Editar um devedor
3. Deletar um devedor
4. Ver que o deletado não aparece mais na lista
5. Ver detalhes de um devedor
```

**✋ CHECKPOINT:** Você testa e aprova.

---

## 🔥 FASE 3: GESTÃO DE DÍVIDAS
**Objetivo:** CRUD de dívidas + cálculo automático de juros

### Back-end:
- ✅ Modelo de dados: `Debt`
  - devedor_id, valor_inicial, valor_atual, taxa_juros, data_emprestimo, data_vencimento
  - status (PENDENTE, PAGO, ATRASADO)
  - notificacao_auto, periodicidade_notificacao, ultima_notificacao
- ✅ Endpoints:
  - `POST /api/debts` (criar dívida)
  - `GET /api/debts` (listar todas)
  - `GET /api/debts?status=atrasado` (filtrar por status)
  - `GET /api/debts/:id` (detalhes)
  - `PUT /api/debts/:id` (editar)
  - `PATCH /api/debts/:id/increase-interest` (aumentar juros manualmente)
  - `PATCH /api/debts/:id/mark-paid` (marcar como paga)
  - `DELETE /api/debts/:id` (soft delete)
- ✅ Cron job para atualizar status (ATRASADO se venceu)
- ✅ Cálculo automático de juros

### Front-end:
- ✅ Página: **Lista de Dívidas**
  - Filtros: Todas, Pendentes, Atrasadas, Pagas
  - Destaque visual para atrasadas (vermelho)
  - Botão "Nova Dívida"
- ✅ Modal: **Cadastrar Dívida**
  - Selecionar devedor (dropdown)
  - Valor, taxa de juros, data de vencimento
  - Toggle: Notificação automática?
  - Se sim: Periodicidade (dias)
- ✅ Modal: **Editar Dívida**
- ✅ Modal: **Aumentar Juros**
- ✅ Ação: Marcar como Paga
- ✅ Página: **Detalhes da Dívida**
  - Mostrar devedor, valor, juros, vencimento, status

### 🧪 Teste da Fase 3:
```
1. Criar dívida para um devedor
2. Ver lista de dívidas
3. Filtrar por atrasadas
4. Aumentar juros de uma dívida
5. Marcar uma como paga
6. Editar uma dívida
```

**✋ CHECKPOINT:** Aprovação.

---

## 🔥 FASE 4: UPLOAD E GESTÃO DE GARANTIAS
**Objetivo:** Upload de fotos/documentos associados a dívidas

### Back-end:
- ✅ Modelo: `Collateral` (divida_id, tipo, nome_arquivo, caminho, descricao)
- ✅ Upload com **Multer**
- ✅ Armazenamento local (pasta `/uploads`)
- ✅ Endpoints:
  - `POST /api/debts/:id/collaterals` (upload de garantia)
  - `GET /api/debts/:id/collaterals` (listar garantias da dívida)
  - `DELETE /api/collaterals/:id` (deletar garantia)
  - `GET /api/collaterals/:id/download` (baixar arquivo)

### Front-end:
- ✅ Na página de **Detalhes da Dívida**:
  - Seção "Garantias"
  - Upload drag-and-drop ou botão
  - Preview de imagens
  - Lista de documentos com ícone
  - Botão baixar/deletar

### 🧪 Teste da Fase 4:
```
1. Abrir detalhes de uma dívida
2. Fazer upload de foto
3. Fazer upload de PDF
4. Ver preview da foto
5. Baixar arquivo
6. Deletar uma garantia
```

**✋ CHECKPOINT:** Aprovação.

---

## 🔥 FASE 5: DASHBOARD E ESTATÍSTICAS
**Objetivo:** Painel com métricas do sistema

### Back-end:
- ✅ Endpoint: `GET /api/dashboard/stats`
  - Total de devedores
  - Valor total emprestado
  - Valor total a receber (com juros)
  - Valor em atraso
  - Número de dívidas ativas
  - Dívidas próximas ao vencimento (próximos 7 dias)

### Front-end:
- ✅ Página: **Dashboard** (home após login)
  - Cards com estatísticas
  - Lista de dívidas próximas ao vencimento
  - Lista de dívidas atrasadas (top 5)
  - Gráfico simples (opcional: pizza ou barras)

### 🧪 Teste da Fase 5:
```
1. Acessar dashboard
2. Ver estatísticas corretas
3. Clicar em uma dívida próxima ao vencimento
4. Verificar dados
```

**✋ CHECKPOINT:** Aprovação.

---

## 🔥 FASE 6: SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
**Objetivo:** Enviar mensagens WhatsApp via seu bot

### Back-end:
- ✅ Modelo: `Notification` (usuario_id, devedor_id, divida_id, mensagem, status, enviado_em)
- ✅ Integração com `https://wtsapi.duckdns.org/enviar`
- ✅ Cron job diário para verificar dívidas com notificacao_auto
- ✅ Lógica:
  - Se (hoje - ultima_notificacao) >= periodicidade → enviar
  - Atualizar ultima_notificacao
  - Salvar em Notification
- ✅ Endpoints:
  - `GET /api/notifications` (histórico)
  - `POST /api/notifications/send-manual/:debtId` (enviar manual)
- ✅ Ao finalizar envio em lote: notificar usuário com resumo

### Front-end:
- ✅ Página: **Histórico de Notificações**
  - Tabela: Data, Devedor, Dívida, Mensagem, Status (enviado/falhou)
  - Filtros por devedor, data
- ✅ Botão na lista de dívidas: "Enviar Notificação Agora"
- ✅ Configuração: Template de mensagem padrão

### 🧪 Teste da Fase 6:
```
1. Configurar dívida com notificação auto (periodicidade 1 dia)
2. Forçar envio manual
3. Ver histórico de notificações
4. Verificar recebimento no WhatsApp
```

**✋ CHECKPOINT:** Aprovação.

---

## 🔥 FASE 7: RELATÓRIOS E EXPORTAÇÃO
**Objetivo:** Gerar PDFs e Excel

### Back-end:
- ✅ Biblioteca: **PDFKit** (PDF) + **ExcelJS** (Excel)
- ✅ Endpoints:
  - `GET /api/reports/general?format=pdf|excel` (relatório geral)
  - `GET /api/reports/debtor/:id?format=pdf|excel` (extrato de um cliente)
  - `GET /api/reports/multiple?debtorIds=1,2,3&format=pdf` (vários clientes)
- ✅ Conteúdo:
  - Geral: resumo financeiro, lista de dívidas ativas, gráficos
  - Cliente: histórico de dívidas, pagamentos, saldo atual

### Front-end:
- ✅ Página: **Relatórios**
  - Opção 1: Relatório Geral (PDF ou Excel)
  - Opção 2: Relatório de Cliente (selecionar cliente)
  - Opção 3: Relatório de Múltiplos Clientes (multi-select)
  - Botão "Gerar" → download automático

### 🧪 Teste da Fase 7:
```
1. Gerar relatório geral em PDF
2. Gerar relatório de um cliente em Excel
3. Gerar relatório de 3 clientes em PDF
4. Verificar conteúdo correto
```

**✋ CHECKPOINT:** Aprovação.

---

## 🔥 FASE 8: AJUSTES FINAIS UI/UX
**Objetivo:** Polimento, responsividade, performance

### Tarefas:
- ✅ Garantir responsividade em mobile
- ✅ Animações suaves (transitions)
- ✅ Loading states em todas as ações
- ✅ Mensagens de erro amigáveis
- ✅ Toasts de sucesso/erro
- ✅ Otimizar queries do banco
- ✅ Lazy loading de imagens
- ✅ Paginação em listas grandes
- ✅ Navegação intuitiva (breadcrumbs, menu)
- ✅ Tema escuro refinado

### 🧪 Teste da Fase 8:
```
1. Testar em mobile (Chrome DevTools)
2. Testar velocidade de carregamento
3. Testar fluxo completo de ponta a ponta
```

**✋ CHECKPOINT:** Aprovação final.

---

## 🔥 FASE 9: DEPLOY EM PRODUÇÃO
**Objetivo:** Subir na VPS com Traefik + Portainer

### Tarefas:
- ✅ Criar `docker-compose.yml` (produção)
- ✅ Configurar labels do Traefik
- ✅ Definir domínio (ex: `devedores.duckdns.org`)
- ✅ Subir no Portainer via Git
- ✅ Configurar variáveis de ambiente (senhas de prod)
- ✅ Testar SSL (HTTPS)
- ✅ Backup inicial do banco
- ✅ Monitoramento de logs

### 🧪 Teste da Fase 9:
```
1. Acessar https://seudominio.duckdns.org
2. Testar fluxo completo em produção
3. Verificar notificações funcionando
4. Verificar SSL (cadeado verde)
```

**✋ CHECKPOINT:** Sistema em produção! 🎉

---

## 📊 RESUMO DAS FASES

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Setup + Auth | 1-2 dias |
| 2 | CRUD Devedores | 1 dia |
| 3 | CRUD Dívidas | 2 dias |
| 4 | Upload Garantias | 1 dia |
| 5 | Dashboard | 1 dia |
| 6 | Notificações | 1-2 dias |
| 7 | Relatórios | 1-2 dias |
| 8 | UI/UX Final | 1-2 dias |
| 9 | Deploy Produção | 1 dia |
| **TOTAL** | | **10-14 dias** |

---

## 🚀 PRÓXIMO PASSO

**FASE 1 - Setup + Autenticação**

Estrutura a ser criada:
1. Backend (Node.js + TypeScript + Express + Prisma + PostgreSQL)
2. Frontend (React + Vite + TailwindCSS + Shadcn/ui)
3. Docker Compose para desenvolvimento
4. Sistema de autenticação completo (JWT)
5. Telas de login/registro

Comando para testar:
```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 📝 STACK TECNOLÓGICA

### Backend:
- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT (autenticação)
- Bcrypt (hash de senhas)
- Multer (upload de arquivos)
- Node-cron (agendamento)
- PDFKit + ExcelJS (relatórios)

### Frontend:
- React 18
- Vite
- TailwindCSS
- Shadcn/ui
- React Query
- React Router
- Axios

### DevOps:
- Docker + Docker Compose
- Nginx (proxy reverso)
- Traefik (SSL automático)
- Portainer (gestão de containers)

---

## 🔗 INTEGRAÇÕES

- **WhatsApp Bot API:** `https://wtsapi.duckdns.org/enviar`
  - Parâmetros: `numero` (258XXXXXXXXX), `mensagem`
  - Usado para notificações automáticas aos devedores

---

## 📋 CONVENÇÕES DO PROJETO

### Git:
- Branch principal: `main`
- Commits: mensagens claras e descritivas
- Não commitar `.env` (apenas `.env.example`)

### Código:
- TypeScript strict mode
- ESLint + Prettier
- Nomenclatura: camelCase (JS/TS), kebab-case (arquivos)
- Componentes React: PascalCase

### Banco de Dados:
- Soft deletes (campo `ativo: boolean`)
- Timestamps: `criado_em`, `atualizado_em`
- Foreign keys com cascade

---

**Última atualização:** 2025-11-08
