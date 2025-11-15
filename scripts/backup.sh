#!/bin/bash
# Script de backup automático do banco de dados PostgreSQL
# Usage: ./scripts/backup.sh

set -e

# Configurações
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="systemagt-postgres"
DB_USER="${POSTGRES_USER:-systemagt_user}"
DB_NAME="${POSTGRES_DB:-systemagt_db}"
BACKUP_FILE="systemagt_backup_${TIMESTAMP}.sql"
KEEP_DAYS=30

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup do banco de dados..."
echo "📅 Data: $(date)"
echo "🗄️  Banco: $DB_NAME"

# Fazer backup
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "${BACKUP_DIR}/${BACKUP_FILE}"

# Comprimir backup
echo "🗜️  Comprimindo backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE_GZ}" | cut -f1)

echo "✅ Backup concluído com sucesso!"
echo "📦 Arquivo: ${BACKUP_FILE_GZ}"
echo "💾 Tamanho: ${BACKUP_SIZE}"

# Limpar backups antigos
echo "🧹 Removendo backups com mais de ${KEEP_DAYS} dias..."
find "$BACKUP_DIR" -name "systemagt_backup_*.sql.gz" -type f -mtime +${KEEP_DAYS} -delete

REMAINING_BACKUPS=$(ls -1 "${BACKUP_DIR}"/systemagt_backup_*.sql.gz 2>/dev/null | wc -l)
echo "📊 Backups mantidos: ${REMAINING_BACKUPS}"

echo "✨ Processo de backup finalizado!"
