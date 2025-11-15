# TESTE - FASE 6: Sistema de Notificações WhatsApp

## Objetivo
Testar o sistema completo de notificações automáticas e manuais via WhatsApp, incluindo envio de resumo para o usuário.

## Pré-requisitos

### 1. Sistema Rodando
```bash
# Verificar se os containers estão ativos
docker ps

# Deve mostrar:
# - devedores-api-dev (porta 3000)
# - devedores-postgres-dev (porta 5432)
# - systemagt-frontend-1 (porta 80)
```

### 2. Dados de Teste no Banco
Você deve ter:
- ✅ Usuário cadastrado com **telefone preenchido** (importante!)
- ✅ Pelo menos 1 devedor com telefone 855075735 (será formatado para 258855075735)
- ✅ Pelo menos 1 dívida ativa vinculada ao devedor

### 3. Endpoint WhatsApp Funcionando
- URL: `https://wtsapi.duckdns.org/enviar`
- Método: POST
- Body: `{ "numero": "258855075735", "mensagem": "texto" }`

---

## TESTES DA FASE 6

### 📝 TESTE 1: Formatação de Telefone

**Objetivo:** Verificar se o sistema formata corretamente os telefones adicionando o prefixo 258.

**Passos:**
1. Cadastre um devedor com telefone: `855075735`
2. Crie uma dívida para este devedor
3. Envie uma notificação manual
4. Verifique nos logs da API:
```bash
docker logs devedores-api-dev --tail 50 | grep "Enviando WhatsApp"
```

**Resultado Esperado:**
```
📱 Enviando WhatsApp para: 258855075735
```

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 📱 TESTE 2: Envio Manual de Notificação

**Objetivo:** Testar o envio manual de notificação via interface.

**Passos:**
1. Acesse o sistema em `http://localhost`
2. Faça login com seu usuário
3. Vá em **Dívidas** e clique em uma dívida ativa
4. Clique no botão **"Enviar Notificação"**
5. Confirme o envio no modal
6. Observe o toast de sucesso/erro

**Resultado Esperado:**
- ✅ Modal mostra telefone formatado: 258855075735
- ✅ Toast aparece com mensagem de sucesso
- ✅ Mensagem chega no WhatsApp do devedor (258855075735)
- ✅ Notificação aparece na página **Notificações** com status ENVIADO (verde)

**Status:** [ ] Passou  [ ] Falhou

**Screenshot da Mensagem no WhatsApp:**
___________________________________________

---

### 🔔 TESTE 3: Página de Histórico de Notificações

**Objetivo:** Verificar se o histórico de notificações está funcionando.

**Passos:**
1. Acesse **Notificações** no menu lateral
2. Verifique os cards de estatísticas no topo
3. Observe a lista de notificações enviadas
4. Clique em **"Ver Mensagem"** de uma notificação
5. Teste o botão de deletar notificação

**Resultado Esperado:**
- ✅ Cards mostram: Total Enviadas (verde), Total Falhadas (vermelho), Total Pendentes (laranja)
- ✅ Lista exibe notificações com status correto (badges coloridos)
- ✅ Modal mostra a mensagem completa enviada
- ✅ Deletar remove a notificação da lista

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 🤖 TESTE 4: Notificações Automáticas (Cron Job)

**Objetivo:** Testar o envio automático de notificações via cron job.

**Preparação:**
1. Edite o arquivo `backend/src/services/notificationCron.ts`
2. Descomente a linha 180 para testar a cada 5 minutos:
```typescript
cron.schedule('*/5 * * * *', processarNotificacoesAutomaticas);
```
3. Rebuild a API:
```bash
docker compose -f docker-compose.dev.yml up --build api -d
```

**Passos:**
1. Configure uma dívida com:
   - `notificacaoAuto = true`
   - `periodicidadeNotificacao = 1` (1 dia)
   - `ultimaNotificacao = null` ou data antiga
   - Status: PENDENTE ou ATRASADO
2. Aguarde 5 minutos
3. Verifique os logs:
```bash
docker logs devedores-api-dev -f
```

**Resultado Esperado:**
```
🔔 [CRON] Iniciando processamento de notificações automáticas...
📊 [CRON] Encontradas X dívidas com notificação automática
📤 [CRON] Enviando notificação para [Nome Devedor] (258855075735)
✅ Mensagem enviada com sucesso para 258855075735
✅ [CRON] Processamento concluído:
   - Enviadas com sucesso: X
   - Puladas: X
   - Falhas: X
```

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 👔 TESTE 5: Resumo para o Usuário (Boss)

**Objetivo:** Verificar se o sistema envia resumo para o usuário após processar notificações.

**Pré-requisito IMPORTANTE:**
1. Certifique-se de que o usuário tem telefone cadastrado!
2. Vá em **Perfil** ou edite diretamente no banco:
```sql
UPDATE users SET telefone = '855075735' WHERE email = 'seu@email.com';
```

**Passos:**
1. Configure o cron para rodar a cada 5 minutos (conforme Teste 4)
2. Aguarde o cron job processar notificações
3. Verifique os logs:
```bash
docker logs devedores-api-dev -f | grep "Enviando resumo"
```
4. **Verifique o WhatsApp do USUÁRIO** (não do devedor!)

**Resultado Esperado:**
- ✅ Log mostra: `📤 [CRON] Enviando resumo para usuário [Seu Nome] (258855075735)`
- ✅ WhatsApp do usuário recebe mensagem de resumo:

```
Olá Boss [Seu Nome]! 👋

📊 Resumo de Notificações - HH:MM

✅ X devedor(es) notificado(s) com sucesso:

• João Silva - 5.000,00 MT
• Maria Santos - 3.000,00 MT

💼 Continue acompanhando suas cobranças pelo sistema!
```

**Status:** [ ] Passou  [ ] Falhou

**Screenshot do Resumo no WhatsApp:**
___________________________________________

---

### 🚨 TESTE 6: Periodicidade Inteligente (PENDENTE vs ATRASADO)

**Objetivo:** Verificar se o sistema respeita periodicidades diferentes baseado no status.

**Caso A - Dívida PENDENTE (antes do vencimento):**
1. Crie dívida com:
   - Data vencimento: daqui 7 dias
   - Status: PENDENTE
   - periodicidadeNotificacao: 3 dias
   - notificacaoAuto: true
2. Aguarde o cron processar
3. Verifique se a mensagem é de **"lembrete de proximidade"**

**Mensagem Esperada:**
```
Olá [Nome],

Este é um lembrete sobre sua dívida que vence em breve.

📅 Data de vencimento: [data]
⏰ Faltam X dias
💰 Valor a pagar: X,XX MT

Por favor, providencie o pagamento até a data de vencimento...
```

**Caso B - Dívida ATRASADO (após vencimento):**
1. Crie dívida com:
   - Data vencimento: 5 dias atrás
   - Status: ATRASADO (ou deixe o cron atualizar automaticamente)
   - notificacaoAuto: true
2. Aguarde o cron processar
3. Verifique se envia **a cada 2 dias (fixo)**, ignorando `periodicidadeNotificacao`
4. Verifique se a mensagem é de **"cobrança de atraso"**

**Mensagem Esperada:**
```
Olá [Nome],

Este é um lembrete sobre sua dívida que venceu em [data].

⚠️ Dívida em atraso há X dias
💰 Valor pendente: X,XX MT

Por favor, entre em contato para regularizar sua situação.

Obrigado!
```

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### ⏱️ TESTE 7: Cron Job de Atualização de Status

**Objetivo:** Verificar se dívidas PENDENTES passam automaticamente para ATRASADO.

**Passos:**
1. Crie uma dívida com:
   - Status: PENDENTE
   - Data vencimento: ontem
2. Aguarde até 1 hora (ou force manualmente no código para 1 minuto)
3. Verifique os logs:
```bash
docker logs devedores-api-dev -f | grep "CRON.*vencidas"
```
4. Verifique no sistema se o status mudou para ATRASADO

**Resultado Esperado:**
```
📅 [CRON] Verificando dívidas vencidas...
📊 [CRON] Encontradas X dívidas vencidas
✅ [CRON] X dívidas marcadas como ATRASADO
   - Dívida XXXXXXXX... (X dias de atraso)
```

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 🛡️ TESTE 8: Proteção contra Bloqueio do WhatsApp

**Objetivo:** Verificar se há delay entre envios múltiplos.

**Passos:**
1. Configure 5+ dívidas com notificação automática
2. Force todas a serem processadas no mesmo cron job
3. Observe os logs com timestamps:
```bash
docker logs devedores-api-dev -f --timestamps
```

**Resultado Esperado:**
- ✅ Deve haver **5 segundos** entre cada envio para devedor
- ✅ Deve haver **3 segundos** antes de enviar resumo para usuário
- ✅ Logs mostram intervalos corretos

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 🔐 TESTE 9: Verificação SSL Desabilitada

**Objetivo:** Confirmar que o sistema ignora certificado auto-assinado.

**Passos:**
1. Revise o código `backend/src/controllers/notificationController.ts` linha 87-89
2. Confirme que está presente:
```typescript
httpsAgent: new https.Agent({
  rejectUnauthorized: false,
}),
```
3. Tente enviar notificação

**Resultado Esperado:**
- ✅ NÃO deve aparecer erro: `self-signed certificate`
- ✅ Notificação é enviada com sucesso

**Status:** [ ] Passou  [ ] Falhou

**Observações:**
___________________________________________

---

### 📊 TESTE 10: Dashboard de Estatísticas (Opcional)

**Objetivo:** Verificar se notificações aparecem no dashboard.

**Passos:**
1. Acesse o **Dashboard**
2. Verifique se há algum indicador de notificações recentes
3. (Se implementado) Verifique gráficos ou cards relacionados

**Status:** [ ] Passou  [ ] Falhou  [ ] Não Implementado

**Observações:**
___________________________________________

---

## 📋 CHECKLIST FINAL

Marque apenas quando TODOS os testes passarem:

- [ ] **TESTE 1:** Formatação de telefone (258 prefix)
- [ ] **TESTE 2:** Envio manual via interface
- [ ] **TESTE 3:** Página de histórico funcional
- [ ] **TESTE 4:** Cron job de notificações automáticas
- [ ] **TESTE 5:** Resumo enviado para o usuário (Boss)
- [ ] **TESTE 6:** Periodicidade inteligente (PENDENTE vs ATRASADO)
- [ ] **TESTE 7:** Cron job de atualização de status
- [ ] **TESTE 8:** Delays entre envios funcionando
- [ ] **TESTE 9:** SSL desabilitado (sem erros de certificado)
- [ ] **TESTE 10:** Dashboard atualizado (se aplicável)

---

## 🐛 BUGS ENCONTRADOS

Liste aqui qualquer bug ou comportamento inesperado:

1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

---

## ✅ APROVAÇÃO DA FASE 6

- [ ] Todos os testes passaram
- [ ] Bugs críticos foram corrigidos
- [ ] Documentação está completa
- [ ] Sistema está pronto para produção

**Data de Aprovação:** ___/___/______

**Assinatura:** _______________________

---

## 📝 OBSERVAÇÕES FINAIS

___________________________________________
___________________________________________
___________________________________________

---

## 🚀 PRÓXIMA FASE

Após aprovação da Fase 6, seguir para:
**FASE 7 - Relatórios e Exportação (PDF/Excel)**
