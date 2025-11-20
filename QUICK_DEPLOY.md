# 🚀 Guía Rápida de Despliegue - PM2 + NGINX

**Servidor:** `root@64.23.253.203`

Esta guía te llevará paso a paso para desplegar tu aplicación en menos de 15 minutos.

---

## 📋 Opción Recomendada: **PM2 + NGINX**

✅ **Ventajas:**
- ⚡ Más rápido de configurar (sin Docker)
- 🔧 Más ligero y eficiente
- 📦 Ya tienes todo configurado
- 🔄 Fácil de actualizar

---

## 🎯 Pasos de Despliegue

### **Paso 1: Conectar al servidor y configurarlo**

```bash
ssh root@64.23.253.203
```

Una vez conectado, ejecuta el script de setup:

```bash
# Si tienes el script localmente, súbelo primero:
# Desde tu máquina local:
scp scripts/setup-server.sh root@64.23.253.203:/root/setup-server.sh

# Luego en el servidor:
chmod +x /root/setup-server.sh
bash /root/setup-server.sh
```

**O manualmente:**

```bash
# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar pnpm
npm install -g pnpm

# 4. Instalar PM2
npm install -g pm2

# 5. Instalar NGINX
apt install -y nginx

# 6. Instalar Certbot (para SSL)
apt install -y certbot python3-certbot-nginx

# 7. Configurar Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 8. Crear usuario deploy
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# 9. Crear directorios
mkdir -p /home/deploy/apps
mkdir -p /home/deploy/backups
chown -R deploy:deploy /home/deploy
```

---

### **Paso 2: Clonar el proyecto**

```bash
# Cambiar a usuario deploy
su - deploy

# Ir al directorio de apps
cd /home/deploy/apps

# Clonar tu repositorio
# Si tienes SSH keys configuradas:
git clone git@github.com:TU_USUARIO/TU_REPO.git orden-autorizacion

# O con HTTPS (te pedirá usuario/contraseña):
git clone https://github.com/TU_USUARIO/TU_REPO.git orden-autorizacion

cd orden-autorizacion
```

**Si tu código está en tu máquina local** (opción alternativa):

```bash
# Desde tu máquina local:
cd /Users/julianmolina/Documents/RUN/demos/dineros
tar -czf app.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .
scp app.tar.gz root@64.23.253.203:/tmp/

# En el servidor:
su - deploy
cd /home/deploy/apps
mkdir orden-autorizacion
cd orden-autorizacion
tar -xzf /tmp/app.tar.gz
rm /tmp/app.tar.gz
```

---

### **Paso 3: Configurar variables de entorno**

```bash
# Crear archivo .env.production
nano .env.production
```

Agrega estas variables (ajusta según necesites):

```env
NODE_ENV=production
PORT=3000
AUTH_SECRET=RUN-SOLUTIONS-NEARLINK360-SECRET-KEY-CHANGE-ME-$(openssl rand -hex 32)
AUTH_URL=http://64.23.253.203
# Si tienes dominio:
# AUTH_URL=https://tu-dominio.com
NEXT_TELEMETRY_DISABLED=1
```

**Generar AUTH_SECRET seguro:**
```bash
openssl rand -hex 32
```

Guarda el archivo (Ctrl+X, luego Y, luego Enter).

---

### **Paso 4: Instalar dependencias y build**

```bash
# Asegurarte de estar en el directorio del proyecto
cd /home/deploy/apps/orden-autorizacion

# Instalar dependencias
pnpm install --frozen-lockfile

# Crear directorio de logs
mkdir -p logs

# Build para producción
NODE_ENV=production pnpm build
```

---

### **Paso 5: Iniciar con PM2**

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

# Configurar inicio automático
pm2 startup
# ⚠️ IMPORTANTE: Copia y ejecuta el comando que PM2 te muestra

# Verificar estado
pm2 status
pm2 logs
```

---

### **Paso 6: Configurar NGINX**

```bash
# Crear configuración de NGINX
sudo nano /etc/nginx/sites-available/orden-autorizacion
```

Pega esta configuración (ajusta el dominio si lo tienes):

```nginx
server {
    listen 80;
    server_name 64.23.253.203;  # Cambia por tu dominio si lo tienes

    # Logs
    access_log /var/log/nginx/orden-access.log;
    error_log /var/log/nginx/orden-error.log;

    # Proxy a la aplicación Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Guarda el archivo y continúa:

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/orden-autorizacion /etc/nginx/sites-enabled/

# Remover sitio default
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### **Paso 7: Configurar SSL (Si tienes dominio)**

```bash
# Si tienes un dominio apuntando a tu servidor:
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones:
# - Email para notificaciones
# - Aceptar términos
# - Redireccionar HTTP a HTTPS (sí)
```

Si no tienes dominio aún, puedes acceder por IP (HTTP solamente).

---

### **Paso 8: Verificar que todo funciona**

```bash
# Ver logs de PM2
pm2 logs orden-autorizacion-compra

# Ver estado
pm2 status

# Verificar que NGINX está corriendo
sudo systemctl status nginx

# Test desde el servidor
curl http://localhost:3000
```

Abre tu navegador y visita:
- **Con IP:** `http://64.23.253.203`
- **Con dominio:** `https://tu-dominio.com`

---

## ✅ Comandos Útiles Post-Despliegue

### Ver logs
```bash
pm2 logs orden-autorizacion-compra
pm2 logs --lines 100  # Últimas 100 líneas
```

### Reiniciar aplicación
```bash
pm2 restart orden-autorizacion-compra
# O recargar sin downtime:
pm2 reload orden-autorizacion-compra
```

### Monitorear recursos
```bash
pm2 monit
```

### Actualizar la aplicación
```bash
cd /home/deploy/apps/orden-autorizacion
git pull origin main
pnpm install
pnpm build
pm2 reload ecosystem.config.js --env production
```

**O usar el script de deploy:**
```bash
cd /home/deploy/apps/orden-autorizacion
./scripts/deploy.sh production
```

---

## 🔧 Troubleshooting Rápido

### La app no responde (502 Bad Gateway)

```bash
# Verificar que PM2 está corriendo
pm2 status

# Ver logs de error
pm2 logs --err

# Reiniciar
pm2 restart orden-autorizacion-compra

# Verificar que el puerto 3000 está libre
sudo lsof -i :3000
```

### NGINX no funciona

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de NGINX
sudo tail -f /var/log/nginx/error.log

# Reiniciar NGINX
sudo systemctl restart nginx
```

### La app no inicia

```bash
# Ver logs detallados
pm2 logs orden-autorizacion-compra --err

# Verificar que existe el build
ls -la /home/deploy/apps/orden-autorizacion/.next

# Rebuild
cd /home/deploy/apps/orden-autorizacion
pnpm build
pm2 restart orden-autorizacion-compra
```

---

## 📊 Checklist Final

- [ ] Servidor configurado (Node.js, pnpm, PM2, NGINX)
- [ ] Proyecto clonado en `/home/deploy/apps/orden-autorizacion`
- [ ] `.env.production` configurado con AUTH_SECRET
- [ ] Build completado exitosamente
- [ ] PM2 iniciado y configurado para auto-start
- [ ] NGINX configurado y funcionando
- [ ] Firewall configurado (puertos 22, 80, 443)
- [ ] SSL configurado (si tienes dominio)
- [ ] Aplicación accesible desde el navegador
- [ ] Logs funcionando correctamente

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando ahora. Si necesitas ayuda, revisa los logs con `pm2 logs`.

**Acceso rápido:**
- App: `http://64.23.253.203` o `https://tu-dominio.com`
- Logs: `pm2 logs`
- Status: `pm2 status`

