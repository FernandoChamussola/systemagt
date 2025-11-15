#!/bin/sh
set -e

echo "⏳ Aguardando banco de dados..."
sleep 3

echo "🔄 Executando migrations..."
npx prisma migrate deploy

echo "✅ Migrations aplicadas com sucesso!"

echo "🚀 Iniciando servidor..."
node dist/index.js
