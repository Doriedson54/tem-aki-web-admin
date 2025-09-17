#!/bin/bash

# Script de Deploy - Negócios do Bairro
# Este script automatiza o processo de deploy para produção

set -e

echo "🚀 Iniciando deploy do Negócios do Bairro..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover imagens antigas (opcional)
read -p "Deseja remover imagens antigas? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removendo imagens antigas..."
    docker system prune -f
fi

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker-compose build --no-cache

# Verificar arquivos de ambiente
echo "🔍 Verificando arquivos de ambiente..."
if [ ! -f "./backend/.env.production" ]; then
    echo "⚠️ Arquivo ./backend/.env.production não encontrado!"
    echo "Por favor, configure as variáveis de ambiente de produção."
    exit 1
fi

if [ ! -f "./web-admin/.env.production" ]; then
    echo "⚠️ Arquivo ./web-admin/.env.production não encontrado!"
    echo "Por favor, configure as variáveis de ambiente de produção."
    exit 1
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose ps

# Testar endpoints
echo "🧪 Testando endpoints..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está funcionando"
else
    echo "❌ Backend não está respondendo"
fi

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Web Admin está funcionando"
else
    echo "❌ Web Admin não está respondendo"
fi

echo "🎉 Deploy concluído!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   Backend API: http://localhost:3000"
echo "   Web Admin: http://localhost:3001"
echo ""
echo "📊 Para monitorar os logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Para parar os serviços:"
echo "   docker-compose down"