# 🧪 TESTE - Sistema de Pagamentos

## ✅ O que foi implementado:

### Backend:
- ✅ Modelo `Payment` com relação para `Debt`
- ✅ Migration para criar tabela `payments`
- ✅ Endpoints de pagamentos:
  - `POST /api/payments` - Registrar pagamento
  - `GET /api/payments?dividaId=xxx` - Listar pagamentos de uma dívida
  - `GET /api/payments/:id` - Ver detalhes de um pagamento
  - `DELETE /api/payments/:id` - Remover pagamento (soft delete)
- ✅ **Validação automática**: não permite pagamento maior que valor restante
- ✅ **Atualização automática de status**: marca dívida como PAGO quando quitada
- ✅ **Recálculo de status**: ao deletar pagamento, recalcula se dívida volta para PENDENTE/ATRASADO

### Frontend:
- ✅ **Cards de dívidas** mostram:
  - Valor total a pagar
  - Valor pago (se houver pagamentos)
  - Valor restante (em destaque vermelho)
- ✅ **Página de detalhes** com:
  - 3 cards de resumo (Total, Pago, Restante)
  - Seção de histórico de pagamentos
  - Botão "Registrar Pagamento"
  - Modal para adicionar pagamento (com validação de valor máximo)
  - Possibilidade de deletar pagamentos
  - Cálculo detalhado mostrando todos os valores

## 🚀 Como testar:

### 1. Rebuild do sistema
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### 2. Testar fluxo completo de pagamentos:

#### Passo 1: Criar uma dívida
1. Vá para **Dívidas** > **Nova Dívida**
2. Preencha:
   - Devedor: Selecione um
   - Valor Inicial: `10000` MT
   - Taxa de Juros: `10%` ao mês
   - Data de Vencimento: Próxima semana
3. ✅ Dívida criada

#### Passo 2: Ver nos cards
1. ✅ Card mostra:
   - Total: ~10000 MT (ou mais se tiver juros)
   - Inicial: 10000 MT
   - Nenhum valor pago ainda
   - Valor restante em vermelho

#### Passo 3: Abrir detalhes da dívida
1. Clique em **"Ver"** na dívida
2. ✅ Ver 3 cards de resumo:
   - Valor Total a Pagar: ~10000 MT
   - Valor Pago: 0 MT
   - Valor Restante: ~10000 MT (vermelho)
3. ✅ Seção "Histórico de Pagamentos" vazia
4. ✅ Botão "Registrar Pagamento" visível

#### Passo 4: Registrar primeiro pagamento (parcial)
1. Clique em **"Registrar Pagamento"**
2. ✅ Modal abre mostrando valor restante
3. Preencha:
   - Valor: `3000` MT
   - Data: Hoje
   - Descrição: "Primeiro pagamento"
4. Clique em **"Registrar"**
5. ✅ Toast verde: "Pagamento registrado!"
6. ✅ Valores atualizados automaticamente:
   - Valor Total: ~10000 MT (não muda)
   - Valor Pago: 3000 MT (verde)
   - Valor Restante: ~7000 MT (vermelho)
7. ✅ Pagamento aparece no histórico com data e descrição

#### Passo 5: Registrar segundo pagamento
1. Clique em **"Registrar Pagamento"** novamente
2. ✅ Valor restante agora mostra ~7000 MT
3. Preencha:
   - Valor: `5000` MT
   - Data: Hoje
   - Descrição: "Segundo pagamento"
4. Clique em **"Registrar"**
5. ✅ Valores atualizados:
   - Valor Pago: 8000 MT
   - Valor Restante: ~2000 MT
6. ✅ Dois pagamentos no histórico

#### Passo 6: Quitar a dívida
1. Clique em **"Registrar Pagamento"**
2. ✅ Valor restante mostra ~2000 MT
3. Preencha o valor restante exato
4. Clique em **"Registrar"**
5. ✅ Status da dívida muda para **PAGO** 🎉
6. ✅ Valor Restante: 0 MT
7. ✅ Botão "Registrar Pagamento" desaparece
8. ✅ Badge verde "PAGO" aparece

#### Passo 7: Testar validação
1. Crie uma nova dívida de 1000 MT
2. Tente registrar pagamento de 1500 MT (mais que o valor total)
3. ✅ Erro: "Valor do pagamento excede o valor restante"

#### Passo 8: Deletar pagamento
1. Abra uma dívida com pagamentos
2. Clique no ícone de **lixeira** em um pagamento
3. ✅ Modal de confirmação
4. Clique em **"Remover"**
5. ✅ Toast: "Pagamento removido!"
6. ✅ Valores recalculados automaticamente
7. ✅ Se a dívida estava PAGO e agora tem saldo, status volta para PENDENTE/ATRASADO

#### Passo 9: Ver na lista de dívidas
1. Volte para **Dívidas**
2. ✅ Cards mostram:
   - Valor total
   - Valor pago (verde, se houver)
   - Valor restante (vermelho, em destaque)

#### Passo 10: Teste responsivo (Mobile)
1. F12 > modo mobile
2. ✅ Cards de resumo se reorganizam
3. ✅ Histórico de pagamentos responsivo
4. ✅ Modal de pagamento responsivo

## 🎨 Características do Design:

### Cards na lista:
- Valor total a pagar (destaque)
- Valor inicial (cinza, pequeno)
- Valor pago (verde, se > 0)
- **Valor restante (vermelho, negrito)**
- Taxa de juros e data de vencimento

### Página de detalhes:
- **3 Cards de Resumo** (Total, Pago, Restante)
- **Histórico de Pagamentos** com:
  - Ícone de dólar verde
  - Valor, data e descrição
  - Botão de deletar
- **Cálculo Detalhado** mostrando:
  - Valor inicial
  - Juros acumulados
  - Valor total
  - Total pago (verde)
  - Valor restante (vermelho, destaque)
- **Modal de Pagamento** com:
  - Destaque do valor restante
  - Input com validação (max = valor restante)
  - Campo de data e descrição opcional

## 💡 Lógica de Negócio:

### Cálculo de Valores:
```
Valor Total = Valor Inicial + Juros Acumulados
Total Pago = Soma de todos os pagamentos
Valor Restante = Valor Total - Total Pago
```

### Status Automático:
- Se `Valor Restante <= 0` → **PAGO**
- Se deletar pagamento e `Valor Restante > 0`:
  - Se `hoje > vencimento` → **ATRASADO**
  - Senão → **PENDENTE**

### Validações:
- ✅ Pagamento não pode exceder valor restante
- ✅ Valor deve ser positivo
- ✅ Dívida deve pertencer ao usuário logado

## ✅ CHECKLIST DE APROVAÇÃO:

- [ ] Consegui ver valor total nos cards
- [ ] Consegui ver valor pago e restante nos cards
- [ ] Consegui registrar pagamento parcial
- [ ] Consegui registrar múltiplos pagamentos
- [ ] Consegui quitar dívida completamente
- [ ] Status mudou para PAGO automaticamente
- [ ] Validação impede pagamento maior que restante
- [ ] Consegui deletar pagamento
- [ ] Status voltou para PENDENTE/ATRASADO ao deletar
- [ ] Histórico de pagamentos mostra data e descrição
- [ ] Página de detalhes mostra todos os valores corretamente
- [ ] Cards respondem bem em mobile

## 🎯 PRÓXIMA FASE:

Quando aprovar esta fase, partimos para a **FASE 4: Upload e Gestão de Garantias**!

Funcionalidades da Fase 4:
- Upload de fotos/documentos
- Vincular garantias a dívidas
- Preview de imagens
- Download de arquivos
- Galeria de garantias

---

**Observação:** O botão "Marcar como Paga" ainda existe, mas com o sistema de pagamentos, o recomendado é usar "Registrar Pagamento" para ter histórico completo.
