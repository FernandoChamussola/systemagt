#!/bin/bash
# Script de restauração do banco de dados PostgreSQL
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "❌ Erro: Arquivo de backup não especificado"
    echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Backups disponíveis:"
    ls -lh ./backups/systemagt_backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="systemagt-postgres"
DB_USER="${POSTGRES_USER:-systemagt_user}"
DB_NAME="${POSTGRES_DB:-systemagt_db}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erro: Arquivo '$BACKUP_FILE' não encontrado"
    exit 1
fi

echo "⚠️  ATENÇÃO: Este processo irá substituir todos os dados do banco!"
echo "📁 Arquivo de backup: $BACKUP_FILE"
echo "🗄️  Banco de destino: $DB_NAME"
echo ""
read -p "Deseja continuar? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restauração cancelada"
    exit 0
fi

echo "🔄 Descomprimindo backup..."
gunzip -c "$BACKUP_FILE" > /tmp/restore_temp.sql

echo "🔄 Restaurando banco de dados..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < /tmp/restore_temp.sql

echo "🧹 Limpando arquivos temporários..."
rm -f /tmp/restore_temp.sql

echo "✅ Restauração concluída com sucesso!"
echo "📅 Data: $(date)"
