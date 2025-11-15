# 🧪 TESTE DA FASE 3 - Gestão de Dívidas

## ✅ O que foi implementado:

### Backend:
- ✅ Modelo `Debt` com enum `DebtStatus` (PENDENTE, PAGO, ATRASADO)
- ✅ Migration para criar tabela `debts`
- ✅ **Cálculo automático de juros** (juros simples)
- ✅ **Atualização automática de status** (atrasado se venceu)
- ✅ Endpoints CRUD completos:
  - `POST /api/debts` - Criar dívida
  - `GET /api/debts` - Listar (com filtros por status e devedor)
  - `GET /api/debts/:id` - Ver detalhes
  - `PUT /api/debts/:id` - Editar dívida
  - `PATCH /api/debts/:id/increase-interest` - Aumentar juros manualmente
  - `PATCH /api/debts/:id/mark-paid` - Marcar como paga
  - `DELETE /api/debts/:id` - Remover (soft delete)

### Frontend:
- ✅ **Cards responsivos** com cores por status
- ✅ **Filtros** (Todas, Pendentes, Atrasadas, Pagas)
- ✅ **Destaque visual** para dívidas atrasadas (borda vermelha)
- ✅ Telas/Modais:
  - Lista de Dívidas com filtros
  - Modal de Cadastro (com seletor de devedor)
  - Modal de Edição
  - Modal de Aumentar Juros
  - Página de Detalhes completa
  - Botão "Marcar como Paga"
- ✅ **Integração** com página de detalhes do devedor
- ✅ Configuração de **notificações automáticas**
- ✅ Ícones de status (✓ Pago, ⚠ Atrasado, ⏰ Pendente)

## 🚀 Como testar:

### 1. Reconstruir e subir o sistema
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### 2. Acessar o sistema
```
http://localhost
```

### 3. Fluxo de teste completo

#### Passo 1: Navegar para Dívidas
1. Faça login
2. Clique em **"Dívidas"** na sidebar
3. ✅ Deve mostrar página vazia com filtros e botão "Nova Dívida"

#### Passo 2: Cadastrar Dívida
1. Clique em **"Nova Dívida"**
2. Selecione um devedor (se não tiver, volte e cadastre um)
3. Preencha:
   - Valor Inicial: `5000`
   - Taxa de Juros: `5.0` (5% ao mês)
   - Data de Vencimento: `2025-01-20` (próxima)
   - ✓ Marque "Ativar notificações automáticas"
   - Periodicidade: `7` (dias)
4. Clique em **"Criar"**
5. ✅ Ver toast verde: "Dívida criada!"
6. ✅ Card aparece com status "PENDENTE" (amarelo)

#### Passo 3: Cadastrar Dívida Atrasada
1. Clique em **"Nova Dívida"** novamente
2. Preencha:
   - Valor: `3000`
   - Juros: `10.0`
   - Data de Vencimento: `2024-12-01` (passada)
3. Clique em **"Criar"**
4. ✅ Card aparece com status "ATRASADO" (vermelho)
5. ✅ Borda do card é vermelha

#### Passo 4: Testar Filtros
1. Clique no filtro **"Atrasadas"**
2. ✅ Deve mostrar apenas a dívida atrasada
3. Clique em **"Pendentes"**
4. ✅ Deve mostrar apenas a pendente
5. Clique em **"Todas"**
6. ✅ Mostra ambas

#### Passo 5: Ver Detalhes da Dívida
1. Clique em **"Ver"** em um card
2. ✅ Página de detalhes abre
3. ✅ Ver:
   - Status com ícone
   - Valor atual (com juros calculados automaticamente!)
   - Valor inicial
   - Juros acumulados
   - Taxa de juros
   - Datas de empréstimo e vencimento
   - Nome do devedor (clicável)
   - Configuração de notificações
   - Cálculo detalhado dos juros

#### Passo 6: Aumentar Juros
1. Volte para lista de dívidas
2. Clique no ícone de **gráfico** (TrendingUp) em um card
3. ✅ Modal "Aumentar Juros" abre
4. ✅ Mostra taxa atual
5. Digite `15.0`
6. Clique em **"Atualizar"**
7. ✅ Toast: "Juros aumentados!"
8. ✅ Card atualiza mostrando nova taxa

#### Passo 7: Marcar como Paga
1. Clique no ícone de **check verde** em um card
2. ✅ Dívida muda para status "PAGO"
3. ✅ Valor atual vai para 0
4. ✅ Ícone muda para ✓ verde
5. ✅ Botões de editar/aumentar juros desaparecem

#### Passo 8: Editar Dívida
1. Clique no ícone de **lápis** em uma dívida pendente
2. Altere o valor inicial para `6000`
3. Clique em **"Salvar"**
4. ✅ Toast: "Dívida atualizada!"
5. ✅ Valor muda no card

#### Passo 9: Ver Dívidas na Página do Devedor
1. Vá para **"Devedores"**
2. Clique em **"Ver"** em um devedor que tem dívidas
3. ✅ Cards de estatísticas mostram:
   - Total em Dívidas (com juros)
   - Dívidas Ativas
   - Dívidas Pagas
4. ✅ Lista de dívidas aparece abaixo
5. ✅ Cada dívida mostra valor e data de vencimento
6. Clique em **"Ver"** em uma dívida
7. ✅ Vai para página de detalhes da dívida

#### Passo 10: Testar Cálculo de Juros
1. Crie uma dívida com:
   - Valor: `1000`
   - Juros: `10%` ao mês
   - Vencimento: daqui a 1 mês
2. ✅ Valor atual deve ser > 1000 (juros já estão calculando!)
3. Aguarde alguns segundos e recarregue a página
4. ✅ Valor continua aumentando conforme o tempo passa

#### Passo 11: Deletar Dívida
1. Clique no ícone de **lixeira** em um card
2. ✅ Modal de confirmação aparece
3. Clique em **"Remover"**
4. ✅ Toast: "Dívida removida!"
5. ✅ Card desaparece

#### Passo 12: Teste Responsivo (Mobile)
1. Pressione F12 e mude para mobile
2. ✅ Filtros se reorganizam
3. ✅ Cards ficam em 1 coluna
4. ✅ Botões ficam acessíveis

## 🎨 Características do Design:

### Cards de Dívidas:
- Ícone + badge de status (cores diferentes)
- Nome do devedor
- Valor atual destacado (grande)
- Valor inicial (pequeno, abaixo)
- Taxa de juros (% ao mês)
- Data de vencimento
- Botões de ação responsivos
- **Borda vermelha** se atrasada
- Hover effect (sombra)

### Filtros:
- Botões com ícones
- Indicador visual do filtro ativo (botão primário)
- Responsivos em mobile

### Status:
- **PENDENTE:** ⏰ Amarelo
- **ATRASADO:** ⚠ Vermelho (borda destacada)
- **PAGO:** ✓ Verde

## 💡 Funcionalidades Especiais:

### Cálculo Automático de Juros:
- Juros simples: `Valor = ValorInicial × (1 + (Taxa/100) × Dias/30)`
- Atualizado automaticamente ao listar/visualizar
- Mostra juros acumulados separadamente

### Status Automático:
- Se hoje > data vencimento → ATRASADO
- Se paga manualmente → PAGO
- Senão → PENDENTE

### Integração:
- Dívidas aparecem na página do devedor
- Link clicável para o devedor na página da dívida
- Estatísticas calculadas em tempo real

## ✅ CHECKLIST DE APROVAÇÃO:

- [ ] Consegui cadastrar dívidas
- [ ] Filtros funcionam corretamente
- [ ] Dívidas atrasadas têm destaque visual
- [ ] Consegui aumentar juros manualmente
- [ ] Consegui marcar dívida como paga
- [ ] Consegui editar uma dívida
- [ ] Consegui deletar uma dívida
- [ ] Página de detalhes mostra todas as informações
- [ ] Juros são calculados automaticamente
- [ ] Dívidas aparecem na página do devedor
- [ ] Cards são responsivos em mobile
- [ ] Configuração de notificações funciona
- [ ] Status muda automaticamente (atrasado)

## 🎯 PRÓXIMA FASE:

Quando aprovar esta fase, partimos para a **FASE 4: Upload e Gestão de Garantias**!

Funcionalidades da Fase 4:
- Upload de fotos/documentos
- Vincular garantias a dívidas
- Preview de imagens
- Download de arquivos
- Galeria de garantias

---

**Observação:** O sistema de notificações automáticas (envio via WhatsApp) será implementado na **FASE 6**. Por enquanto, apenas a configuração está disponível.
