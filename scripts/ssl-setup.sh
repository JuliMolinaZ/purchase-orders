#!/bin/bash

###############################################################################
# Script para configurar SSL con Let's Encrypt
# Uso: ./scripts/ssl-setup.sh your-domain.com
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar argumento
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un dominio${NC}"
    echo "Uso: $0 your-domain.com"
    exit 1
fi

DOMAIN=$1
WWW_DOMAIN="www.$DOMAIN"
EMAIL="admin@$DOMAIN"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configurando SSL para $DOMAIN${NC}"
echo -e "${GREEN}========================================${NC}"

# Verificar que NGINX está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Error: NGINX no está instalado${NC}"
    exit 1
fi

# Verificar que Certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Certbot no encontrado. Instalando...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
fi

# Pedir email
read -p "Email para notificaciones SSL (default: $EMAIL): " INPUT_EMAIL
if [ ! -z "$INPUT_EMAIL" ]; then
    EMAIL=$INPUT_EMAIL
fi

echo ""
echo -e "${YELLOW}Configuración:${NC}"
echo -e "  Dominio: ${GREEN}$DOMAIN${NC}"
echo -e "  WWW: ${GREEN}$WWW_DOMAIN${NC}"
echo -e "  Email: ${GREEN}$EMAIL${NC}"
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Verificar DNS
echo -e "${YELLOW}Verificando DNS...${NC}"
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
WWW_IP=$(dig +short $WWW_DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

echo "  $DOMAIN -> $DOMAIN_IP"
echo "  $WWW_DOMAIN -> $WWW_IP"
echo "  Servidor -> $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠ Advertencia: El dominio no apunta a este servidor${NC}"
    read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Obtener certificado
echo -e "${YELLOW}Obteniendo certificado SSL...${NC}"
sudo certbot --nginx \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificado SSL obtenido exitosamente${NC}"
else
    echo -e "${RED}✗ Error al obtener certificado${NC}"
    exit 1
fi

# Configurar auto-renovación
echo -e "${YELLOW}Configurando auto-renovación...${NC}"
sudo systemctl status certbot.timer

# Test de renovación
echo -e "${YELLOW}Probando renovación...${NC}"
sudo certbot renew --dry-run

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ SSL configurado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Tu sitio ahora es accesible en:${NC}"
echo -e "  ${GREEN}https://$DOMAIN${NC}"
echo -e "  ${GREEN}https://$WWW_DOMAIN${NC}"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  ${YELLOW}sudo certbot renew${NC}          - Renovar certificado manualmente"
echo -e "  ${YELLOW}sudo certbot certificates${NC}   - Ver certificados instalados"
echo -e "  ${YELLOW}sudo systemctl status certbot.timer${NC} - Ver estado auto-renovación"
echo ""
echo -e "${YELLOW}Verifica tu SSL en:${NC}"
echo -e "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
