#!/bin/sh
set -e

echo "⏳ Aguardando banco de dados..."
sleep 5

echo "🔄 Sincronizando estrutura do banco de dados..."
# Usar db push para sincronizar schema com banco (mais confiável em produção)
npx prisma db push --skip-generate --accept-data-loss

echo "✅ Banco de dados sincronizado com sucesso!"

echo "🚀 Iniciando servidor..."
node dist/index.js
