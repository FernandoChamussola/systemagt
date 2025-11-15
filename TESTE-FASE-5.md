# 🧪 TESTE DA FASE 5 - Dashboard e Estatísticas

## ✅ O que foi implementado:

### Backend:
- ✅ Endpoint `GET /api/dashboard/stats`
- ✅ Cálculo de estatísticas financeiras:
  - Total de devedores ativos
  - Valor total emprestado
  - Valor total a receber (com juros)
  - Valor em atraso
  - Número de dívidas ativas
- ✅ Listagem de dívidas próximas ao vencimento (próximos 7 dias)
- ✅ Listagem de dívidas atrasadas (top 5)
- ✅ Estatísticas por status (pendentes, atrasadas, pagas)
- ✅ Cálculo correto de valores restantes (total - pagamentos)

### Frontend:
- ✅ Página Dashboard completa e responsiva
- ✅ **4 Cards principais de estatísticas:**
  - Total de Devedores
  - Total Emprestado
  - Total a Receber (verde)
  - Valor em Atraso (vermelho)
- ✅ **3 Cards secundários:**
  - Dívidas Ativas
  - Próximas ao Vencimento
  - Dívidas Atrasadas
- ✅ **Seção "Próximas ao Vencimento":**
  - Lista de dívidas que vencem nos próximos 7 dias
  - Badge com dias restantes
  - Link direto para detalhes da dívida
  - Nome e telefone do devedor
  - Valor restante e data de vencimento
- ✅ **Seção "Dívidas Atrasadas":**
  - Top 5 dívidas com maior atraso
  - Badge vermelho com dias de atraso
  - Destaque visual (fundo vermelho claro)
  - Link direto para detalhes
- ✅ **Ações Rápidas:**
  - Ver Devedores
  - Ver Dívidas
  - Cadastrar Dívida
  - Notificações (desabilitado)
- ✅ Loading states com skeleton
- ✅ Formatação de moeda em Meticais (MT)
- ✅ Formatação de datas em português
- ✅ Design responsivo (mobile, tablet, desktop)

## 🚀 Como testar:

### 1. Rebuild e subir o sistema
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### 2. Acessar o sistema
```
http://localhost
```

### 3. Fluxo de teste completo

#### Passo 1: Verificar Dashboard Vazio
1. Faça login no sistema
2. ✅ Você será redirecionado para o Dashboard
3. ✅ Ver 4 cards principais com valores zerados:
   - Total de Devedores: 0
   - Total Emprestado: 0,00 MT
   - Total a Receber: 0,00 MT
   - Em Atraso: 0,00 MT
4. ✅ Ver cards secundários zerados
5. ✅ Ver mensagem "Nenhuma dívida próxima ao vencimento"
6. ✅ Ver mensagem "Nenhuma dívida atrasada! 🎉"

#### Passo 2: Criar dados de teste
1. Vá em **"Devedores"** e crie 3 devedores:
   - João Silva (258843001234)
   - Maria Santos (258843005678)
   - Pedro Costa (258843009999)

2. Vá em **"Dívidas"** e crie as seguintes dívidas:

   **Dívida 1 - Próxima ao vencimento:**
   - Devedor: João Silva
   - Valor Inicial: 5000 MT
   - Taxa de Juros: 10%
   - Data de Vencimento: **Daqui a 3 dias**

   **Dívida 2 - Próxima ao vencimento:**
   - Devedor: Maria Santos
   - Valor Inicial: 10000 MT
   - Taxa de Juros: 15%
   - Data de Vencimento: **Daqui a 5 dias**

   **Dívida 3 - Atrasada:**
   - Devedor: Pedro Costa
   - Valor Inicial: 8000 MT
   - Taxa de Juros: 20%
   - Data de Vencimento: **15 dias atrás** (ex: se hoje é 11/11, coloque 27/10)

   **Dívida 4 - Atrasada (mais antiga):**
   - Devedor: João Silva
   - Valor Inicial: 3000 MT
   - Taxa de Juros: 10%
   - Data de Vencimento: **30 dias atrás**

   **Dívida 5 - Paga:**
   - Devedor: Maria Santos
   - Valor Inicial: 2000 MT
   - Taxa de Juros: 5%
   - Data de Vencimento: Qualquer
   - **Após criar, marque como PAGA ou registre pagamento total**

#### Passo 3: Voltar ao Dashboard
1. Clique em **"Dashboard"** na sidebar
2. ✅ Aguarde o carregamento (ver skeleton/loading)
3. ✅ Ver estatísticas atualizadas nos 4 cards principais

#### Passo 4: Verificar Cards Principais
1. ✅ **Total de Devedores:** Deve mostrar **3**
2. ✅ **Total Emprestado:** Deve mostrar **28000 MT** (5000+10000+8000+3000+2000)
3. ✅ **Total a Receber:** Deve mostrar o valor com juros das dívidas não pagas
   - Exemplo: ~26700 MT (depende dos juros calculados)
4. ✅ **Em Atraso:** Deve mostrar valor das 2 dívidas atrasadas com juros
   - Exemplo: ~12960 MT

#### Passo 5: Verificar Cards Secundários
1. ✅ **Dívidas Ativas:** Deve mostrar **4** (excluindo a paga)
2. ✅ **Próximas ao Vencimento:** Deve mostrar **2**
3. ✅ **Dívidas Atrasadas:** Deve mostrar **2**

#### Passo 6: Verificar Seção "Próximas ao Vencimento"
1. ✅ Ver 2 dívidas listadas
2. ✅ Primeira dívida (João Silva):
   - Nome: João Silva
   - Telefone: 258843001234
   - Badge laranja: "3 dias"
   - Valor Restante: 5500 MT (aproximado com juros)
   - Data de Vencimento formatada
3. ✅ Segunda dívida (Maria Santos):
   - Nome: Maria Santos
   - Badge laranja: "5 dias"
   - Valor Restante: 11500 MT (aproximado)
4. ✅ Hover nos cards muda o fundo
5. ✅ Clicar em um card redireciona para detalhes da dívida

#### Passo 7: Verificar Seção "Dívidas Atrasadas"
1. ✅ Ver 2 dívidas listadas (ordenadas por atraso)
2. ✅ Primeira dívida (mais atrasada - João Silva):
   - Nome: João Silva
   - Badge vermelho: "30 dias atrasado"
   - Fundo vermelho claro
   - Valor Restante: 3300 MT (aproximado)
   - Data de vencimento formatada
3. ✅ Segunda dívida (Pedro Costa):
   - Badge vermelho: "15 dias atrasado"
   - Valor Restante: 9600 MT (aproximado)
4. ✅ Hover nos cards escurece o fundo vermelho
5. ✅ Clicar redireciona para detalhes

#### Passo 8: Testar Ações Rápidas
1. ✅ Clicar em **"Ver Devedores"** → Vai para /devedores
2. ✅ Clicar em **"Ver Dívidas"** → Vai para /dividas
3. ✅ Clicar em **"Cadastrar Dívida"** → Vai para /dividas (onde há botão de criar)
4. ✅ Botão "Notificações" está desabilitado (próxima fase)

#### Passo 9: Testar Pagamentos Parciais
1. Vá para detalhes da dívida de João Silva (3 dias para vencer)
2. Registre um pagamento parcial de 2000 MT
3. Volte ao Dashboard
4. ✅ Ver que **Total a Receber** diminuiu
5. ✅ Ver que **Valor Restante** da dívida diminuiu

#### Passo 10: Testar Responsividade (Mobile)
1. Pressione **F12** → Modo mobile (375px)
2. ✅ Cards principais ficam em 2 colunas (2x2)
3. ✅ Cards secundários ficam em 1 coluna
4. ✅ Listas de dívidas ficam em 1 coluna
5. ✅ Ações rápidas se reorganizam
6. ✅ Textos não quebram de forma estranha
7. ✅ Badges se ajustam corretamente

#### Passo 11: Testar Responsividade (Tablet)
1. Modo tablet (768px)
2. ✅ Cards principais ficam em 2 colunas
3. ✅ Cards secundários ficam em 3 colunas
4. ✅ Seções de dívidas lado a lado (2 colunas)

#### Passo 12: Testar Responsividade (Desktop)
1. Modo desktop (1920px)
2. ✅ Cards principais ficam em 4 colunas
3. ✅ Cards secundários ficam em 3 colunas
4. ✅ Seções de dívidas lado a lado (2 colunas)
5. ✅ Tudo bem espaçado e legível

#### Passo 13: Testar Atualização em Tempo Real
1. Com o Dashboard aberto, abra outra aba
2. Crie uma nova dívida na outra aba
3. Volte para o Dashboard e **recarregue a página**
4. ✅ Ver estatísticas atualizadas
5. ✅ Nova dívida aparece nas listas (se aplicável)

#### Passo 14: Testar com Muitas Dívidas
1. Crie mais 10 dívidas próximas ao vencimento
2. Volte ao Dashboard
3. ✅ Todas as dívidas aparecem na lista
4. ✅ Scroll funciona se necessário

5. Crie 8 dívidas atrasadas
6. Volte ao Dashboard
7. ✅ Ver apenas **Top 5** na lista
8. ✅ As 5 mais atrasadas aparecem primeiro

## 🎨 Características do Design:

### Cards de Estatísticas:
- Ícones coloridos em fundo claro
- Valores em destaque com fonte grande
- Labels descritivos
- Cores semânticas:
  - Azul: Total Emprestado
  - Verde: Total a Receber
  - Vermelho: Em Atraso
  - Primário: Devedores e Dívidas Ativas
  - Laranja: Próximas ao Vencimento

### Listas de Dívidas:
- Cards interativos com hover
- Nome e telefone do devedor
- Badges com informação temporal
- Valores em destaque
- Link direto para detalhes

### Estados Vazios:
- Ícones grandes e claros
- Mensagens amigáveis
- Incentivo para ação

### Loading:
- Skeleton com animação de pulse
- Mantém layout consistente

## 💡 Lógica de Negócio:

### Cálculo de Estatísticas:
```
Total Emprestado = Soma dos valores iniciais de todas as dívidas
Total a Receber = Soma dos valores restantes de dívidas não pagas (com juros - pagamentos)
Valor em Atraso = Soma dos valores restantes de dívidas com status ATRASADO
Dívidas Ativas = Contagem de dívidas não pagas
```

### Próximas ao Vencimento:
- Dívidas com status PENDENTE
- Data de vencimento entre hoje e 7 dias no futuro
- Ordenadas por data de vencimento (mais próxima primeiro)

### Dívidas Atrasadas:
- Dívidas com status ATRASADO
- Limitadas às 5 com maior atraso
- Ordenadas por data de vencimento (mais antiga primeiro)

## ✅ CHECKLIST DE APROVAÇÃO:

- [ ] Cards principais mostram valores corretos
- [ ] Total Emprestado corresponde à soma dos valores iniciais
- [ ] Total a Receber inclui juros e desconta pagamentos
- [ ] Valor em Atraso mostra apenas dívidas atrasadas
- [ ] Contadores (devedores, dívidas ativas) estão corretos
- [ ] Lista de próximas ao vencimento mostra dívidas dos próximos 7 dias
- [ ] Lista de atrasadas mostra top 5
- [ ] Badges mostram dias corretamente
- [ ] Formatação de moeda está correta (MT)
- [ ] Formatação de datas em português
- [ ] Links redirecionam para páginas corretas
- [ ] Hover nos cards funciona
- [ ] Estados vazios aparecem quando não há dados
- [ ] Loading state funciona
- [ ] Responsividade em mobile está correta
- [ ] Responsividade em tablet está correta
- [ ] Responsividade em desktop está correta
- [ ] Valores atualizam após criar/editar dívidas
- [ ] Valores atualizam após registrar pagamentos

## 🎯 PRÓXIMA FASE:

Quando aprovar esta fase, partimos para a **FASE 6: Sistema de Notificações Automáticas**!

Funcionalidades da Fase 6:
- Integração com API do WhatsApp (`https://wtsapi.duckdns.org/enviar`)
- Modelo de `Notification` no banco
- Cron job para envio automático
- Histórico de notificações
- Envio manual de notificações
- Templates de mensagem personalizáveis

---

## 📊 Exemplos de Valores Esperados:

Com o cenário de teste proposto:

### Cards Principais:
```
Total de Devedores: 3
Total Emprestado: 28.000 MT
Total a Receber: ~26.700 MT (depende dos pagamentos)
Em Atraso: ~12.960 MT
```

### Cards Secundários:
```
Dívidas Ativas: 4
Próximas ao Vencimento: 2
Dívidas Atrasadas: 2
```

### Cálculos (com juros simples):
```
Dívida 1 (João, 5000 MT, 10%): 5.500 MT
Dívida 2 (Maria, 10000 MT, 15%): 11.500 MT
Dívida 3 (Pedro, 8000 MT, 20%): 9.600 MT (ATRASADA)
Dívida 4 (João, 3000 MT, 10%): 3.300 MT (ATRASADA)
Dívida 5 (Maria, 2000 MT, 5%): 2.100 MT (PAGA - não conta no total a receber)

Total a Receber: 5500 + 11500 + 9600 + 3300 = 29.900 MT
Em Atraso: 9600 + 3300 = 12.900 MT
```

**Observação:** Os valores podem variar ligeiramente dependendo de como os juros são calculados no backend e se há pagamentos registrados.

---

**Última atualização:** 2025-11-11
