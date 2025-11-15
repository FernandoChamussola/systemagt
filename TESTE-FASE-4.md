# 🧪 TESTE DA FASE 4 - Upload e Gestão de Garantias

## ✅ O que foi implementado:

### Backend:
- ✅ Modelo `Collateral` no Prisma
- ✅ Migration para tabela `collaterals`
- ✅ Configuração do **Multer** para upload de arquivos
- ✅ Armazenamento local na pasta `/uploads`
- ✅ Endpoints completos:
  - `POST /api/collaterals` - Upload de garantia
  - `GET /api/collaterals?dividaId=xxx` - Listar garantias de uma dívida
  - `GET /api/collaterals/:id` - Ver detalhes de uma garantia
  - `GET /api/collaterals/:id/download` - Baixar arquivo
  - `DELETE /api/collaterals/:id` - Remover garantia (soft delete)
- ✅ Validação de tipos de arquivo (imagens e documentos)
- ✅ Limite de 10MB por arquivo

### Frontend:
- ✅ Componente `CollateralSection` completo
- ✅ Integração na página de detalhes da dívida
- ✅ **Upload de arquivos** (clique no botão)
- ✅ **Preview de imagens** (thumbnail + modal ampliado)
- ✅ **Lista de documentos** com ícones
- ✅ **Download de arquivos**
- ✅ **Exclusão de garantias** com confirmação
- ✅ Campo de descrição opcional
- ✅ Grid responsivo (1, 2 ou 3 colunas)

## 🚀 Como testar:

### 1. Reconstruir e subir o sistema
```bash
# Parar containers
docker compose -f docker-compose.dev.yml down

# Reconstruir e subir
docker compose -f docker-compose.dev.yml up --build
```

### 2. Acessar o sistema
```
http://localhost
```

### 3. Fluxo de teste completo

#### Passo 1: Navegar para uma Dívida
1. Faça login
2. Vá em **"Dívidas"** na sidebar
3. Clique em **"Ver"** em uma dívida existente
4. ✅ Role até o final da página
5. ✅ Deve ver a seção **"Garantias"**

#### Passo 2: Upload de Imagem
1. Clique no botão **"Adicionar Arquivo"**
2. Selecione uma **foto** (JPG, PNG, GIF, WebP)
3. ✅ Modal de upload abre automaticamente
4. ✅ Ver preview da imagem
5. ✅ Ver nome e tamanho do arquivo
6. Digite uma descrição: `Foto do carro como garantia`
7. Clique em **"Enviar"**
8. ✅ Toast verde: "Arquivo enviado!"
9. ✅ Card da garantia aparece na lista
10. ✅ Thumbnail da imagem é exibido no card

#### Passo 3: Upload de Documento
1. Clique em **"Adicionar Arquivo"** novamente
2. Selecione um **PDF ou DOC**
3. ✅ Modal abre com ícone de documento
4. ✅ Não mostra preview (apenas ícone)
5. Digite uma descrição: `Contrato assinado`
6. Clique em **"Enviar"**
7. ✅ Card do documento aparece
8. ✅ Ícone de documento é exibido

#### Passo 4: Testar Preview de Imagem
1. Clique na **thumbnail** de uma imagem
2. ✅ Modal em tamanho grande abre
3. ✅ Imagem é exibida em alta resolução
4. ✅ Nome e descrição aparecem no topo
5. ✅ Botão "Baixar" está disponível
6. Clique em **"Fechar"**

#### Passo 5: Baixar Arquivo
1. Clique no botão **"Baixar"** em um card
2. ✅ Download do arquivo inicia
3. ✅ Arquivo é salvo com o nome original
4. ✅ Abra o arquivo baixado
5. ✅ Arquivo está íntegro e completo

#### Passo 6: Baixar via Modal
1. Clique na thumbnail de uma imagem
2. No modal, clique em **"Baixar"**
3. ✅ Download da imagem inicia
4. ✅ Arquivo tem o nome correto

#### Passo 7: Testar Múltiplos Uploads
1. Faça upload de mais 3-4 arquivos diferentes
2. ✅ Todos aparecem na grid
3. ✅ Grid se reorganiza responsivamente
4. ✅ Cada card mostra informações corretas

#### Passo 8: Deletar Garantia
1. Clique no botão de **lixeira** em um card
2. ✅ Modal de confirmação aparece
3. ✅ Mensagem: "Tem certeza que deseja remover este arquivo?"
4. Clique em **"Remover"**
5. ✅ Toast: "Garantia removida!"
6. ✅ Card desaparece da lista

#### Passo 9: Testar Validação de Arquivo
1. Tente fazer upload de um arquivo não suportado (ex: .zip, .exe, .mp4)
2. ✅ Deve mostrar erro de tipo de arquivo inválido

#### Passo 10: Testar Limite de Tamanho
1. Tente fazer upload de um arquivo > 10MB
2. ✅ Deve mostrar erro de tamanho excedido

#### Passo 11: Teste Responsivo (Mobile)
1. Pressione F12 e mude para modo mobile
2. ✅ Cards ficam em 1 coluna
3. ✅ Botões são acessíveis
4. ✅ Preview funciona corretamente
5. ✅ Modal de upload se ajusta à tela

#### Passo 12: Testar sem Garantias
1. Acesse uma dívida sem garantias
2. ✅ Mensagem vazia aparece:
   - Ícone de upload
   - "Nenhuma garantia cadastrada ainda"
   - "Adicione fotos ou documentos relacionados à dívida"

#### Passo 13: Testar Persistência
1. Faça upload de alguns arquivos
2. Feche a página e abra novamente
3. ✅ Garantias ainda aparecem
4. ✅ Imagens carregam corretamente
5. ✅ Downloads funcionam

## 🎨 Características do Design:

### Cards de Garantias:
- Ícone apropriado (imagem ou documento)
- Nome do arquivo (truncado se muito longo)
- Tamanho do arquivo formatado (KB ou MB)
- Descrição (se fornecida)
- Thumbnail para imagens (clicável)
- Botões de ação (Baixar, Deletar)
- Hover effect (fundo muda)
- Grid responsivo

### Modal de Upload:
- Preview da imagem selecionada
- Informações do arquivo (nome e tamanho)
- Campo de descrição opcional
- Botão para cancelar
- Loading state durante upload

### Modal de Preview:
- Imagem em alta resolução
- Nome e descrição no topo
- Botão de download
- Botão de fechar

### Seção Vazia:
- Ícone grande de upload
- Mensagem amigável
- Incentivo para adicionar arquivos

## 📱 Pontos de Responsividade:

- **Mobile (< 640px):** 1 coluna
- **Tablet (640px - 1024px):** 2 colunas
- **Desktop (> 1024px):** 3 colunas

## 💡 Funcionalidades Especiais:

### Tipos de Arquivo Suportados:
- **Imagens:** JPG, JPEG, PNG, GIF, WebP
- **Documentos:** PDF, DOC, DOCX

### Segurança:
- Apenas usuário dono da dívida pode fazer upload
- Validação de tipo de arquivo no backend
- Limite de tamanho (10MB)
- Soft delete (arquivo mantido por segurança)

### Performance:
- Preview de imagens otimizado
- Download via stream
- Armazenamento local eficiente

## 🔍 Verificações no Backend:

### Ver arquivos salvos:
```bash
# Entrar no container do backend
docker exec -it devedores-api-dev sh

# Listar arquivos na pasta uploads
ls -lh /app/uploads

# Ver detalhes
ls -lh /app/uploads | grep jpg
```

### Ver dados no banco:
```bash
# Conectar ao PostgreSQL
docker exec -it devedores-postgres-dev psql -U devedores_user -d devedores_db

# Ver garantias cadastradas
SELECT id, nome_arquivo, tipo_arquivo, tamanho, descricao, ativo FROM collaterals;

# Ver garantias de uma dívida específica
SELECT * FROM collaterals WHERE divida_id = 'ID_DA_DIVIDA';

# Sair
\q
```

## ✅ CHECKLIST DE APROVAÇÃO:

- [ ] Consegui fazer upload de uma imagem
- [ ] Consegui fazer upload de um PDF
- [ ] Preview de imagem funciona (thumbnail + modal)
- [ ] Consegui baixar um arquivo
- [ ] Consegui deletar uma garantia
- [ ] Arquivo foi removido da lista após deletar
- [ ] Cards são responsivos em mobile
- [ ] Campo de descrição funciona
- [ ] Validação de tipo de arquivo funciona
- [ ] Mensagem de erro aparece para arquivos inválidos
- [ ] Múltiplas garantias aparecem corretamente
- [ ] Modal de confirmação de exclusão funciona
- [ ] Toast de sucesso aparece nas ações
- [ ] Seção vazia mostra mensagem amigável
- [ ] Formatação de tamanho está correta (KB/MB)

## 🎯 PRÓXIMA FASE:

Quando aprovar esta fase, partimos para a **FASE 5: Dashboard e Estatísticas**!

Funcionalidades da Fase 5:
- Painel principal com métricas
- Cards de estatísticas (total emprestado, a receber, em atraso)
- Lista de dívidas próximas ao vencimento
- Lista de dívidas atrasadas (top 5)
- Gráficos (opcional)

---

**Observação:** Os arquivos são armazenados localmente em `/backend/uploads`. Em produção, considere usar um serviço de armazenamento em nuvem (AWS S3, Google Cloud Storage, etc.).
