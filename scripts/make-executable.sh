#!/bin/bash

###############################################################################
# Script para hacer ejecutables todos los scripts
# Uso: bash scripts/make-executable.sh
###############################################################################

echo "Haciendo scripts ejecutables..."

chmod +x scripts/deploy.sh
chmod +x scripts/setup-server.sh
chmod +x scripts/ssl-setup.sh
chmod +x scripts/make-executable.sh

echo "✓ Todos los scripts son ahora ejecutables"
echo ""
echo "Scripts disponibles:"
echo "  ./scripts/deploy.sh          - Deploy automatizado"
echo "  ./scripts/setup-server.sh    - Setup inicial del servidor"
echo "  ./scripts/ssl-setup.sh       - Configuración SSL"
