#!/bin/bash

###############################################################################
# Script de deployment automatizado
# Uso: ./scripts/deploy.sh [production|staging]
###############################################################################

set -e  # Exit on error

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-production}
APP_DIR="/home/deploy/orden-autorizacion"
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Iniciando deployment - $ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json no encontrado. ¿Estás en el directorio correcto?${NC}"
    exit 1
fi

# 2. Backup del código actual
echo -e "${YELLOW}[1/8] Creando backup...${NC}"
mkdir -p $BACKUP_DIR
if [ -d ".next" ]; then
    tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz . 2>/dev/null || true
    echo -e "${GREEN}✓ Backup creado${NC}"
else
    echo -e "${YELLOW}⚠ No hay build previo para hacer backup${NC}"
fi

# 3. Pull del código más reciente
echo -e "${YELLOW}[2/8] Obteniendo código más reciente...${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Código actualizado${NC}"

# 4. Instalar dependencias
echo -e "${YELLOW}[3/8] Instalando dependencias...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# 5. Type check
echo -e "${YELLOW}[4/8] Verificando tipos TypeScript...${NC}"
pnpm type-check
echo -e "${GREEN}✓ Types verificados${NC}"

# 6. Lint
echo -e "${YELLOW}[5/8] Ejecutando lint...${NC}"
pnpm lint || echo -e "${YELLOW}⚠ Warnings de lint encontrados${NC}"

# 7. Build
echo -e "${YELLOW}[6/8] Building aplicación...${NC}"
NODE_ENV=production pnpm build
echo -e "${GREEN}✓ Build completado${NC}"

# 8. Reiniciar aplicación (detectar PM2 o Docker)
echo -e "${YELLOW}[7/8] Reiniciando aplicación...${NC}"

if command -v pm2 &> /dev/null; then
    # PM2 deployment
    pm2 reload ecosystem.config.js --env $ENVIRONMENT
    echo -e "${GREEN}✓ PM2 recargado${NC}"
elif command -v docker-compose &> /dev/null; then
    # Docker deployment
    docker-compose down
    docker-compose build
    docker-compose up -d
    echo -e "${GREEN}✓ Docker reiniciado${NC}"
else
    echo -e "${YELLOW}⚠ No se detectó PM2 ni Docker. Reinicia manualmente.${NC}"
fi

# 9. Health check
echo -e "${YELLOW}[8/8] Verificando health check...${NC}"
sleep 5

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/pdf || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ]; then
        echo -e "${GREEN}✓ Aplicación funcionando correctamente${NC}"
    else
        echo -e "${RED}✗ Health check falló (HTTP $HTTP_CODE)${NC}"
        echo -e "${YELLOW}Verifica los logs para más detalles${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl no disponible, omitiendo health check${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Comandos útiles:"
echo -e "  ${YELLOW}pm2 logs${NC}         - Ver logs en tiempo real"
echo -e "  ${YELLOW}pm2 monit${NC}        - Monitor de recursos"
echo -e "  ${YELLOW}pm2 status${NC}       - Estado de procesos"
echo ""

exit 0
