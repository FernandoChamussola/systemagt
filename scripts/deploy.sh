#!/bin/bash
# Script de deploy para produção
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 SystemAGT - Deploy para Produção"
echo "======================================"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Erro: Arquivo .env não encontrado!"
    echo "📝 Por favor, copie o .env.production.example para .env e configure as variáveis:"
    echo "   cp .env.production.example .env"
    echo "   nano .env"
    exit 1
fi

# Verificar se a rede traefik-public existe
if ! docker network ls | grep -q traefik-public; then
    echo "⚠️  Rede 'traefik-public' não encontrada. Criando..."
    docker network create traefik-public
    echo "✅ Rede criada com sucesso!"
fi

# Fazer backup antes do deploy
echo ""
echo "📦 Criando backup antes do deploy..."
if [ -f ./scripts/backup.sh ]; then
    bash ./scripts/backup.sh || echo "⚠️  Aviso: Falha no backup (talvez seja o primeiro deploy)"
fi

# Pull das imagens base
echo ""
echo "📥 Atualizando imagens base..."
docker compose pull postgres || true

# Build e deploy
echo ""
echo "🔨 Fazendo build das imagens..."
docker compose build --no-cache

echo ""
echo "🚀 Iniciando containers..."
docker compose up -d

# Aguardar containers iniciarem
echo ""
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Executar migrations
echo ""
echo "🔄 Executando migrations do banco de dados..."
docker compose exec -T api npx prisma migrate deploy || echo "⚠️  Aviso: Erro ao executar migrations"

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker compose ps

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🌐 Acesse o sistema em: https://systemagt.duckdns.org"
echo "📋 Para ver os logs: docker compose logs -f"
echo "🔍 Para verificar status: docker compose ps"
echo ""
