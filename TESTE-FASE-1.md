# 🧪 TESTE DA FASE 1 - Autenticação

## ✅ O que foi implementado:

### Backend:
- ✅ API REST com Node.js + TypeScript + Express
- ✅ Banco de dados PostgreSQL com Prisma ORM
- ✅ Autenticação JWT
- ✅ Endpoints:
  - `POST /api/auth/register` - Criar conta
  - `POST /api/auth/login` - Fazer login
  - `GET /api/auth/me` - Buscar dados do usuário logado
  - `POST /api/auth/logout` - Fazer logout

### Frontend:
- ✅ Interface moderna com React + Vite
- ✅ Design caprichado com TailwindCSS + Shadcn/ui
- ✅ Tema escuro por padrão
- ✅ Telas:
  - Login (com validação)
  - Registro (com validação)
  - Dashboard (protegido)
- ✅ Proteção de rotas
- ✅ Feedback visual com toasts
- ✅ Loading states

## 🚀 Como testar:

### 1. Subir o sistema
```bash
# Na pasta raiz do projeto (systemagt)
docker compose -f docker-compose.dev.yml up --build
```

**Aguarde** até ver as mensagens:
```
devedores-api-dev      | 🚀 Servidor rodando na porta 3000
```

### 2. Acessar o sistema
```
Abra o navegador em: http://localhost
```

### 3. Fluxo de teste completo

#### Passo 1: Criar conta
1. Você será redirecionado para a tela de Login
2. Clique em **"Criar conta"**
3. Preencha:
   - Nome completo: `Seu Nome`
   - Email: `teste@email.com`
   - Telefone: `+258 84 123 4567` (opcional)
   - Senha: `senha123`
4. Clique em **"Criar conta"**
5. ✅ Você deve ver um toast verde: "Conta criada com sucesso!"
6. ✅ Você deve ser redirecionado para o Dashboard

#### Passo 2: Ver o Dashboard
1. ✅ Verifique que o header mostra: "Bem-vindo, Seu Nome!"
2. ✅ Veja os cards com estatísticas (ainda zerados)
3. Clique em **"Sair"**

#### Passo 3: Fazer Login
1. Você volta para a tela de Login
2. Digite:
   - Email: `teste@email.com`
   - Senha: `senha123`
3. Clique em **"Entrar"**
4. ✅ Você deve ver um toast verde: "Login realizado com sucesso!"
5. ✅ Você deve ser redirecionado para o Dashboard novamente

#### Passo 4: Testar erros
1. Faça logout
2. Tente fazer login com senha errada
3. ✅ Você deve ver um toast vermelho: "Email ou senha incorretos"

#### Passo 5: Testar proteção de rotas
1. Faça logout
2. Tente acessar diretamente: `http://localhost/dashboard`
3. ✅ Você deve ser redirecionado automaticamente para `/login`

## 🎨 Design

O sistema possui:
- **Tema escuro** elegante
- **Gradientes sutis** no background
- **Cards com bordas** e sombras
- **Ícones** em todos os inputs
- **Loading states** com spinners
- **Animações suaves** nas transições
- **Toasts** de feedback
- **Responsivo** (funciona em mobile)

## 🔍 Verificações adicionais:

### Ver logs do backend:
```bash
docker compose -f docker-compose.dev.yml logs -f api
```

### Ver logs do frontend:
```bash
docker compose -f docker-compose.dev.yml logs -f frontend
```

### Ver banco de dados:
```bash
# Conectar ao container do PostgreSQL
docker exec -it devedores-postgres-dev psql -U devedores_user -d devedores_db

# Ver usuários criados
SELECT id, nome, email, telefone, criado_em FROM users;

# Sair
\q
```

## 🛑 Parar o sistema:
```bash
docker compose -f docker-compose.dev.yml down
```

## 🗑️ Limpar tudo (incluindo banco de dados):
```bash
docker compose -f docker-compose.dev.yml down -v
```

## ❌ Problemas comuns:

### Porta 80 já está em uso:
```bash
# Pare o serviço que está usando a porta 80
# Ou mude a porta no docker-compose.dev.yml:
# ports:
#   - "8080:80"  # Acesse em http://localhost:8080
```

### Erro de conexão com o banco:
```bash
# Aguarde alguns segundos para o banco inicializar
# Ou reinicie os containers:
docker compose -f docker-compose.dev.yml restart
```

### Mudanças no código não aparecem:
```bash
# Reconstrua os containers:
docker compose -f docker-compose.dev.yml up --build
```

## ✅ CHECKLIST DE APROVAÇÃO:

- [ ] Consegui subir o sistema sem erros
- [ ] Consegui criar uma conta
- [ ] Recebi feedback visual (toast) ao criar conta
- [ ] Fui redirecionado para o Dashboard
- [ ] Vi meu nome no header do Dashboard
- [ ] Consegui fazer logout
- [ ] Consegui fazer login novamente
- [ ] Testei senha errada e vi mensagem de erro
- [ ] Tentei acessar /dashboard sem login e fui redirecionado
- [ ] O design está bonito e moderno
- [ ] O sistema funciona em mobile (teste no DevTools)

## 🎯 PRÓXIMA FASE:

Quando aprovar esta fase, partimos para a **FASE 2: Gestão de Clientes/Devedores**!
