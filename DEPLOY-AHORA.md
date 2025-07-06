# 🚀 DEPLOY AHORA EN RAILWAY - Paso a Paso

## ✅ TODO LISTO
Tu código ya está en GitHub y preparado para Railway!

**Repositorio**: https://github.com/Facu02/backend-intelivision

---

## 🚂 PASOS PARA RAILWAY (5 minutos)

### 1. Ir a Railway
🔗 **https://railway.app**

### 2. Registrarse/Iniciar sesión
- Click "Login" 
- Elegir "Login with GitHub"
- Autorizar Railway

### 3. Crear nuevo proyecto
- Click "New Project"
- Click "Deploy from GitHub repo"
- Buscar "backend-intelivision"
- Click "Deploy"

### 4. Esperar el build
⏳ Railway detectará automáticamente:
- Node.js project
- `npm start` command
- Puerto desde `process.env.PORT`

### 5. Configurar variables de entorno
📋 En Railway dashboard:
- Click en tu proyecto
- Click "Variables" (lado izquierdo)
- Agregar ESTAS variables:

```env
AWS_ACCESS_KEY_ID=tu-access-key-aqui
AWS_SECRET_ACCESS_KEY=tu-secret-key-aqui
AWS_REGION=us-east-1
BEDROCK_AGENT_ID=CRN7DOSZ8F
BEDROCK_AGENT_ALIAS_ID=YICGFFJUEA
NODE_ENV=production
LOG_LEVEL=info
AGGREGATION_WINDOW_MS=2000
MAX_AGGREGATION_SIZE=50
```

⚠️ **IMPORTANTE**: Cambia `tu-access-key-aqui` y `tu-secret-key-aqui` por tus credenciales reales de AWS.

### 6. Obtener URL pública
Railway te dará una URL como:
**https://backend-intelivision-production.up.railway.app**

---

## 🧪 PROBAR EL DEPLOY

### Opción 1: Test rápido HTTP
```bash
curl https://tu-url.railway.app
```
Deberías ver: `{"name":"InteLeVision Backend","version":"1.0.0"...}`

### Opción 2: Test completo WebSocket
1. Abrir `test-railway.js`
2. Cambiar la línea 4:
   ```javascript
   const RAILWAY_URL = 'https://tu-url-real.railway.app';
   ```
3. Ejecutar:
   ```bash
   node test-railway.js
   ```

---

## 📊 MONITOREO

### Ver logs en tiempo real
- Railway dashboard → tu proyecto → "Deployments"
- Click en el deployment actual
- Ver logs en vivo

### Métricas
- CPU, memoria, requests
- Todo visible en Railway dashboard

---

## 🆘 TROUBLESHOOTING

### ❌ Deploy falla
1. Verificar que package.json tenga `"start": "node index.js"`
2. Revisar logs en Railway
3. Verificar que todas las dependencias estén en package.json

### ❌ App responde pero WebSocket falla
1. Verificar variables de entorno de AWS
2. Probar con logs: `LOG_LEVEL=debug` en variables
3. Revisar que Bedrock Agent esté activo

### ❌ "EADDRINUSE" error
- Railway maneja puertos automáticamente
- Verificar que uses `process.env.PORT || 3001`

---

## 🎯 PRÓXIMOS PASOS

### 1. Después del deploy exitoso
- Copiar URL de Railway
- Actualizar frontend para usar nueva URL
- Probar conexión completa

### 2. Para el frontend Angular
Cambiar WebSocket URL a:
```typescript
const socket = io('https://tu-url.railway.app');
```

### 3. Monitoreo continuo
- Revisar uso mensual en Railway
- Configurar alertas si es necesario
- Plan upgrade si superas límites gratuitos

---

## 📞 SOPORTE RÁPIDO

- **Railway Discord**: https://discord.gg/railway
- **Railway Docs**: https://docs.railway.app
- **Status**: https://status.railway.app

---

## ✨ ¡LISTO!

¡Tu InteliVision Backend estará funcionando en la nube en 5 minutos! 🎉

**Límites gratuitos**: $5 USD/mes (más que suficiente para desarrollo y pruebas) 