#!/bin/bash

###############################################################################
# Script de configuración inicial del servidor
# Uso: bash <(curl -s https://raw.githubusercontent.com/your-repo/main/scripts/setup-server.sh)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
  ____  _   _ _   _   ____        _       _   _
 |  _ \| | | | \ | | / ___|  ___ | |_   _| |_(_) ___  _ __  ___
 | |_) | | | |  \| | \___ \ / _ \| | | | | __| |/ _ \| '_ \/ __|
 |  _ <| |_| | |\  |  ___) | (_) | | |_| | |_| | (_) | | | \__ \
 |_| \_\\___/|_| \_| |____/ \___/|_|\__,_|\__|_|\___/|_| |_|___/

 Sistema de Órdenes de Autorización y Compra
 Setup Script v1.0
EOF
echo -e "${NC}"

# Verificar que estamos como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Este script debe ejecutarse como root${NC}"
   exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configurando servidor...${NC}"
echo -e "${GREEN}========================================${NC}"

# 1. Actualizar sistema
echo -e "${YELLOW}[1/10] Actualizando sistema...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# 2. Instalar utilidades básicas
echo -e "${YELLOW}[2/10] Instalando utilidades básicas...${NC}"
apt install -y curl wget git build-essential ufw
echo -e "${GREEN}✓ Utilidades instaladas${NC}"

# 3. Instalar Node.js 20
echo -e "${YELLOW}[3/10] Instalando Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js instalado${NC}"

# 4. Instalar pnpm
echo -e "${YELLOW}[4/10] Instalando pnpm...${NC}"
npm install -g pnpm
pnpm --version
echo -e "${GREEN}✓ pnpm instalado${NC}"

# 5. Instalar PM2
echo -e "${YELLOW}[5/10] Instalando PM2...${NC}"
npm install -g pm2
pm2 --version
echo -e "${GREEN}✓ PM2 instalado${NC}"

# 6. Instalar NGINX
echo -e "${YELLOW}[6/10] Instalando NGINX...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✓ NGINX instalado${NC}"

# 7. Instalar Certbot (Let's Encrypt)
echo -e "${YELLOW}[7/10] Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot instalado${NC}"

# 8. Configurar Firewall
echo -e "${YELLOW}[8/10] Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
echo -e "${GREEN}✓ Firewall configurado${NC}"

# 9. Crear usuario deploy
echo -e "${YELLOW}[9/10] Creando usuario deploy...${NC}"
if id "deploy" &>/dev/null; then
    echo -e "${YELLOW}Usuario deploy ya existe${NC}"
else
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo -e "${GREEN}✓ Usuario deploy creado${NC}"
fi

# 10. Configurar estructura de directorios
echo -e "${YELLOW}[10/10] Configurando directorios...${NC}"
mkdir -p /home/deploy/apps
mkdir -p /home/deploy/backups
mkdir -p /home/deploy/logs
chown -R deploy:deploy /home/deploy
echo -e "${GREEN}✓ Directorios configurados${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Configuración completada${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Siguiente paso:${NC}"
echo -e "1. Cambiar a usuario deploy: ${YELLOW}su - deploy${NC}"
echo -e "2. Clonar el repositorio en /home/deploy/apps/"
echo -e "3. Configurar la aplicación"
echo ""
echo -e "${BLUE}Información del sistema:${NC}"
echo -e "  Node.js: $(node --version)"
echo -e "  pnpm: $(pnpm --version)"
echo -e "  PM2: $(pm2 --version)"
echo -e "  NGINX: $(nginx -v 2>&1)"
echo ""
echo -e "${YELLOW}Recuerda configurar tu dominio y SSL!${NC}"
echo ""
