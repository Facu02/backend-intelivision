# ✅ Checklist para Railway Deploy

## 📋 Pre-Deploy Checklist

### Código listo
- ✅ Puerto configurado: `process.env.PORT || 3001`
- ✅ Package.json con script "start": "node index.js"
- ✅ .gitignore configurado (excluye .env y node_modules)
- ✅ Dependencias instaladas
- ✅ Código sin errores

### Variables de entorno necesarias
```env
# AWS Bedrock (obligatorias)
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
BEDROCK_AGENT_ID=CRN7DOSZ8F
BEDROCK_AGENT_ALIAS_ID=YICGFFJUEA

# Server (opcionales)
NODE_ENV=production
LOG_LEVEL=info
AGGREGATION_WINDOW_MS=2000
MAX_AGGREGATION_SIZE=50
```

## 🚀 Pasos para Railway

### 1. Preparar repositorio
```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Ready for Railway deploy"

# Crear repo en GitHub
# Ir a https://github.com/new
# Subir código
git remote add origin https://github.com/tu-usuario/intelivision-backend.git
git branch -M main
git push -u origin main
```

### 2. Deploy en Railway
1. Ir a https://railway.app
2. Registrarse con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar tu repositorio
5. "Deploy Now"

### 3. Configurar variables de entorno
1. En Railway dashboard → "Variables"
2. Agregar todas las variables de AWS
3. Guardar cambios

### 4. Verificar deploy
- Railway te dará una URL pública
- Probar: `curl https://tu-app.railway.app`
- Probar WebSocket con test-client.js

## 🎯 URLs importantes
- **Railway**: https://railway.app
- **GitHub**: https://github.com/new
- **Tu app**: https://tu-app.railway.app (después del deploy)

## 📞 Soporte
- **Railway Discord**: https://discord.gg/railway
- **Docs**: https://docs.railway.app 