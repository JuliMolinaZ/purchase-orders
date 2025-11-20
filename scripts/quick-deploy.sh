#!/bin/bash

###############################################################################
# Script de Despliegue Rápido - PM2 + NGINX
# Uso: ./scripts/quick-deploy.sh [domain]
# Ejemplo: ./scripts/quick-deploy.sh mi-dominio.com
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN=${1:-""}
APP_NAME="orden-autorizacion-compra"
APP_DIR="/home/deploy/apps/orden-autorizacion"
NGINX_SITE="orden-autorizacion"

echo -e "${BLUE}"
cat << "EOF"
  ____  _   _ _   _   ____        _       _   _
 |  _ \| | | | \ | | / ___|  ___ | |_   _| |_(_) ___  _ __  ___
 | |_) | | | |  \| | \___ \ / _ \| | | | | __| |/ _ \| '_ \/ __|
 |  _ <| |_| | |\  |  ___) | (_) | | |_| | |_| | (_) | | | \__ \
 |_| \_\\___/|_| \_| |____/ \___/|_|\__,_|\__|_|\___/|_| |_|___/

 Despliegue Rápido - PM2 + NGINX
EOF
echo -e "${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json no encontrado.${NC}"
    echo -e "${YELLOW}Ejecuta este script desde la raíz del proyecto.${NC}"
    exit 1
fi

# Verificar si se ejecuta como root o como deploy
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Ejecutando como root. Algunos comandos PM2 pueden requerir usuario deploy.${NC}"
    USER_MODE="root"
elif [ "$USER" = "deploy" ]; then
    USER_MODE="deploy"
else
    echo -e "${YELLOW}⚠️  Se recomienda ejecutar como usuario 'deploy'${NC}"
    USER_MODE="$USER"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Iniciando despliegue rápido${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. Verificar/Instalar dependencias del sistema
echo -e "${YELLOW}[1/8] Verificando dependencias del sistema...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm no encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 no encontrado. Instalando...${NC}"
    npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}NGINX no encontrado. Instalando...${NC}"
    apt install -y nginx
fi

echo -e "${GREEN}✓ Dependencias verificadas${NC}"
echo ""

# 2. Instalar dependencias del proyecto
echo -e "${YELLOW}[2/8] Instalando dependencias del proyecto...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# 3. Crear directorio de logs
echo -e "${YELLOW}[3/8] Configurando directorios...${NC}"
mkdir -p logs
echo -e "${GREEN}✓ Directorios configurados${NC}"
echo ""

# 4. Verificar variables de entorno
echo -e "${YELLOW}[4/8] Verificando variables de entorno...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production no encontrado. Creando uno básico...${NC}"
    
    # Generar AUTH_SECRET seguro
    if command -v openssl &> /dev/null; then
        AUTH_SECRET=$(openssl rand -hex 32)
    else
        AUTH_SECRET="RUN-SOLUTIONS-NEARLINK360-SECRET-KEY-$(date +%s | sha256sum | head -c 32)"
    fi
    
    cat > .env.production << EOF
NODE_ENV=production
PORT=3000
AUTH_SECRET=$AUTH_SECRET
AUTH_URL=${DOMAIN:-http://64.23.253.203}
NEXT_TELEMETRY_DISABLED=1
EOF
    
    echo -e "${GREEN}✓ Archivo .env.production creado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Revisa y ajusta .env.production según necesites${NC}"
else
    echo -e "${GREEN}✓ .env.production encontrado${NC}"
fi
echo ""

# 5. Build
echo -e "${YELLOW}[5/8] Building aplicación...${NC}"
NODE_ENV=production pnpm build
echo -e "${GREEN}✓ Build completado${NC}"
echo ""

# 6. Configurar PM2
echo -e "${YELLOW}[6/8] Configurando PM2...${NC}"

# Detener si ya está corriendo
pm2 delete $APP_NAME 2>/dev/null || true

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Configurar auto-start (si no está configurado)
if ! pm2 startup | grep -q "already setup"; then
    echo -e "${YELLOW}⚠️  Ejecuta el comando que PM2 muestra arriba para configurar auto-start${NC}"
fi

echo -e "${GREEN}✓ PM2 configurado${NC}"
echo ""

# 7. Configurar NGINX
echo -e "${YELLOW}[7/8] Configurando NGINX...${NC}"

if [ "$USER_MODE" != "root" ]; then
    echo -e "${YELLOW}⚠️  Configurando NGINX requiere permisos sudo${NC}"
    SUDO_CMD="sudo"
else
    SUDO_CMD=""
fi

# Crear configuración de NGINX
$SUDO_CMD tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-64.23.253.203 _};

    access_log /var/log/nginx/orden-access.log;
    error_log /var/log/nginx/orden-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Habilitar sitio
$SUDO_CMD ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Remover default
$SUDO_CMD rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
if $SUDO_CMD nginx -t; then
    $SUDO_CMD systemctl restart nginx
    $SUDO_CMD systemctl enable nginx
    echo -e "${GREEN}✓ NGINX configurado y reiniciado${NC}"
else
    echo -e "${RED}✗ Error en la configuración de NGINX${NC}"
    exit 1
fi
echo ""

# 8. Configurar SSL (si hay dominio)
if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}[8/8] Configurando SSL para $DOMAIN...${NC}"
    
    if command -v certbot &> /dev/null; then
        echo -e "${YELLOW}⚠️  Ejecuta manualmente para obtener certificado SSL:${NC}"
        echo -e "${BLUE}   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
    else
        echo -e "${YELLOW}⚠️  Certbot no encontrado. Instalando...${NC}"
        $SUDO_CMD apt install -y certbot python3-certbot-nginx
        echo -e "${BLUE}   Luego ejecuta: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
    fi
else
    echo -e "${YELLOW}[8/8] Saltando SSL (sin dominio especificado)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Despliegue completado${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Mostrar información
echo -e "${BLUE}Información del despliegue:${NC}"
echo -e "  App Name: ${YELLOW}$APP_NAME${NC}"
echo -e "  Puerto: ${YELLOW}3000${NC}"
echo -e "  URL: ${YELLOW}${DOMAIN:-http://64.23.253.203}${NC}"
echo ""

# Mostrar estado de PM2
echo -e "${BLUE}Estado de PM2:${NC}"
pm2 status

echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  ${YELLOW}pm2 logs${NC}           - Ver logs en tiempo real"
echo -e "  ${YELLOW}pm2 monit${NC}          - Monitor de recursos"
echo -e "  ${YELLOW}pm2 restart $APP_NAME${NC}  - Reiniciar aplicación"
echo -e "  ${YELLOW}pm2 reload $APP_NAME${NC}   - Recargar sin downtime"
echo ""

# Health check
echo -e "${BLUE}Verificando salud de la aplicación...${NC}"
sleep 3

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
        echo -e "${GREEN}✓ Aplicación respondiendo correctamente (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Aplicación respondió con HTTP $HTTP_CODE${NC}"
        echo -e "${YELLOW}   Verifica los logs: pm2 logs $APP_NAME${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl no disponible, omitiendo health check${NC}"
fi

echo ""
echo -e "${GREEN}¡Listo! Tu aplicación debería estar funcionando.${NC}"
echo ""

exit 0

