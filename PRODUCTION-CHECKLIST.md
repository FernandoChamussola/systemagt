# ✅ Production Checklist - SystemAGT

## 📋 Antes do Deploy

### Infraestrutura
- [ ] VPS provisionada e acessível via SSH
- [ ] Docker instalado (versão 20.10+)
- [ ] Docker Compose instalado (versão 2.0+)
- [ ] Traefik rodando e configurado
- [ ] Rede `traefik-public` criada
- [ ] Firewall configurado (portas 80, 443, 22 abertas)
- [ ] DNS `systemagt.duckdns.org` apontando para IP da VPS

### Repositório
- [ ] Código commitado e pushed para o repositório
- [ ] `.env` NÃO está no repositório (apenas .env.example)
- [ ] README.md atualizado
- [ ] DEPLOY.md revisado

### Configuração
- [ ] Arquivo `.env` criado com valores de produção
- [ ] `POSTGRES_PASSWORD` forte (min 20 caracteres)
- [ ] `JWT_SECRET` seguro (gerado com openssl)
- [ ] `WHATSAPP_API_URL` configurada corretamente

---

## 🚀 Durante o Deploy

### Build e Deploy
- [ ] Repositório clonado em `/opt/systemagt`
- [ ] Permissões dos scripts configuradas (`chmod +x scripts/*.sh`)
- [ ] `docker compose build` executado sem erros
- [ ] `docker compose up -d` executado com sucesso
- [ ] Migrations do Prisma executadas

### Verificação de Containers
- [ ] Container `systemagt-postgres` está **healthy**
- [ ] Container `systemagt-api` está **running**
- [ ] Container `systemagt-frontend` está **running**
- [ ] Nenhum container em loop de restart

---

## ✅ Após o Deploy

### Testes de Acesso
- [ ] Site acessível via HTTPS: `https://systemagt.duckdns.org`
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] Redirect HTTP → HTTPS funcionando
- [ ] API respondendo: `https://systemagt.duckdns.org/api/health`

### Testes Funcionais
- [ ] Página de login carrega corretamente
- [ ] Consegue criar nova conta
- [ ] Consegue fazer login
- [ ] Dashboard carrega com estatísticas
- [ ] Consegue criar um devedor
- [ ] Consegue criar uma dívida
- [ ] Upload de garantias funciona
- [ ] Notificações WhatsApp funcionam

### Segurança
- [ ] Senhas fortes configuradas
- [ ] JWT_SECRET não exposto
- [ ] `.env` com permissões corretas (600)
- [ ] HTTPS forçado (sem acesso HTTP)
- [ ] Headers de segurança configurados

### Backup
- [ ] Diretório `/backups` existe e é gravável
- [ ] Script de backup testado (`./scripts/backup.sh`)
- [ ] Primeiro backup manual criado
- [ ] Cron job de backup configurado (opcional)
- [ ] Script de restore testado (em ambiente de teste)

### Monitoramento
- [ ] Logs do sistema acessíveis (`docker compose logs`)
- [ ] Disk space suficiente (min 10GB livres)
- [ ] Memória RAM suficiente (min 2GB)
- [ ] CPU não sobrecarregada

---

## 📊 Validação Final

### Performance
- [ ] Tempo de resposta da homepage < 2s
- [ ] Tempo de resposta da API < 500ms
- [ ] Imagens e assets carregando corretamente
- [ ] Sem erros no console do navegador

### Base de Dados
- [ ] Conexão com PostgreSQL estável
- [ ] Migrations aplicadas corretamente
- [ ] Dados de teste removidos (se houver)
- [ ] Índices criados (Prisma faz automaticamente)

### Notificações
- [ ] WhatsApp API acessível da VPS
- [ ] Teste de envio manual funciona
- [ ] Cron job de notificações agendado (9h diárias)
- [ ] Mensagens incluem `#DEBTTRACKER`

---

## 🔄 Pós-Deploy

### Documentação
- [ ] Credenciais de acesso documentadas em local seguro
- [ ] Procedimento de backup documentado
- [ ] Contatos de suporte anotados
- [ ] Plano de disaster recovery definido

### Manutenção
- [ ] Agenda de backups definida
- [ ] Processo de atualização documentado
- [ ] Monitoramento de logs configurado
- [ ] Alertas de disco cheio configurados (opcional)

### Treinamento
- [ ] Usuários treinados no sistema
- [ ] Manual de uso criado (se necessário)
- [ ] Fluxo de cobrança definido
- [ ] Suporte técnico disponível

---

## 🆘 Contatos de Emergência

### Suporte Técnico
- **Repositório:** [GitHub](https://github.com/seu-usuario/systemagt)
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/systemagt/issues)

### Serviços Externos
- **WhatsApp API:** wtsapi.duckdns.org
- **DNS:** DuckDNS (systemagt.duckdns.org)
- **SSL:** Let's Encrypt (via Traefik)

---

## 📝 Notas Importantes

1. **Senhas de Produção:**
   - Nunca usar senhas de desenvolvimento em produção
   - Gerar JWT_SECRET com: `openssl rand -base64 32`
   - Armazenar credenciais em gerenciador de senhas

2. **Backups:**
   - Fazer backup ANTES de qualquer atualização
   - Manter backups por 30 dias
   - Testar restore periodicamente

3. **Atualizações:**
   - Sempre testar em ambiente de dev primeiro
   - Fazer backup antes de atualizar
   - Documentar mudanças no changelog

4. **Segurança:**
   - Manter Docker e sistema operacional atualizados
   - Monitorar logs de acesso
   - Revisar permissões de arquivos periodicamente

---

## ✨ Status do Deploy

- **Data do Deploy:** __________
- **Versão:** __________
- **Deploy por:** __________
- **Status:** ⬜ Sucesso | ⬜ Parcial | ⬜ Falha

**Observações:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Checklist concluído? Sistema pronto para produção! 🎉**
