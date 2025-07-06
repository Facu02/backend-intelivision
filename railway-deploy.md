# 🚀 Guía de Deploy en Railway

## Paso 1: Preparar el repositorio

### 1.1 Subir a GitHub
```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Initial commit: InteliVision Backend"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/intelivision-backend.git
git push -u origin master
```

### 1.2 Verificar archivos necesarios
- ✅ `package.json` con `"start": "node index.js"`
- ✅ `index.js` configurado para puerto dinámico
- ✅ `.gitignore` incluyendo `node_modules/` y `.env`

## Paso 2: Deploy en Railway

### 2.1 Crear cuenta
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub
3. Autoriza el acceso a tus repositorios

### 2.2 Crear nuevo proyecto
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Selecciona `intelivision-backend`
4. Click "Deploy Now"

### 2.3 Configurar variables de entorno
En Railway dashboard:
1. Ve a tu proyecto
2. Click "Variables"
3. Agrega estas variables:

```env
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
BEDROCK_AGENT_ID=tu-agent-id
BEDROCK_AGENT_ALIAS_ID=tu-alias-id

# Server Configuration
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Data Aggregation
AGGREGATION_WINDOW_MS=2000
MAX_AGGREGATION_SIZE=50
```

### 2.4 Verificar el deploy
1. Espera a que termine el build
2. Railway te dará una URL pública
3. Visita `https://tu-app.railway.app` para verificar

## Paso 3: Configurar dominio personalizado (opcional)

### 3.1 Dominio Railway
- Railway te asigna un dominio automáticamente
- Ejemplo: `intelivision-backend-production.up.railway.app`

### 3.2 Dominio personalizado
1. En Railway dashboard, ve a "Settings"
2. Click "Domains"
3. Click "Custom Domain"
4. Ingresa tu dominio
5. Configura DNS según las instrucciones

## Paso 4: Probar la conexión

### 4.1 Verificar HTTP
```bash
curl https://tu-app.railway.app
```

### 4.2 Verificar WebSocket
Cambia la URL en `test-client.js`:
```javascript
const socket = io('https://tu-app.railway.app');
```

## Paso 5: Monitoreo y logs

### 5.1 Ver logs
- En Railway dashboard, click "Deployments"
- Click en el deployment activo
- Ve logs en tiempo real

### 5.2 Métricas
- CPU, memoria y tráfico de red
- Disponible en dashboard de Railway

## 🔧 Troubleshooting

### Error: Port already in use
- Railway maneja el puerto automáticamente
- Asegúrate de usar `process.env.PORT`

### Error: WebSocket connection failed
- Verifica que la URL sea `https://` (no `http://`)
- Railway soporta WebSockets automáticamente

### Error: Bedrock Agent
- Verifica las variables de entorno de AWS
- Confirma que las credenciales sean correctas

## 📊 Límites del tier gratuito

- **$5 USD de crédito** por mes
- **500 horas** de ejecución
- **1GB RAM** máximo
- **1GB disco** máximo

## 🎯 Siguientes pasos

1. **Monitorear uso**: Revisa el dashboard regularmente
2. **Configurar alertas**: Para cuando se acerque al límite
3. **Backup automático**: Railway hace backups automáticos
4. **Escalabilidad**: Upgrade a plan pagado si es necesario

## 🆘 Soporte

- **Documentación**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Comunidad muy activa
- **Email**: soporte directo desde el dashboard 