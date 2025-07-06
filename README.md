# InteLeVision Backend

Backend para InteLeVision - Asistente de Visión con IA para personas con discapacidad visual.

## 🎯 Descripción

InteLeVision Backend es un servidor Node.js que procesa datos de sensores en tiempo real desde lentes Meta, los agrega durante 2 segundos y utiliza OpenAI para generar descripciones útiles para personas con discapacidad visual.

## 🚀 Características

- **WebSocket en tiempo real** con Socket.io
- **Agregación inteligente** de datos de sensores (2 segundos)
- **Integración con OpenAI** para descripciones contextuales
- **Sistema de fallback** robusto
- **Logging detallado** para debugging
- **CORS habilitado** para desarrollo
- **Endpoints REST** para monitoreo

## 📋 Requisitos

- Node.js >= 16.0.0
- NPM o Yarn
- Clave de API de OpenAI

## 🛠️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd intelevision-backend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp env.example .env
```

4. **Editar `.env` con tu configuración:**
```env
OPENAI_API_KEY=tu_openai_api_key_aqui
PORT=3001
NODE_ENV=development
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Verificar instalación
```bash
curl http://localhost:3001/health
```

## 📡 API WebSocket

### Eventos del Cliente

#### `sensor-data`
Envía datos de sensores desde el frontend.

**Estructura de datos:**
```json
{
  "timestamp": 1699123456789,
  "personas": [
    {
      "posicion": "frente|izquierda|derecha",
      "distancia": "0.8m|1.2m|2.1m|3.0m+",
      "expresion": "feliz|triste|sorprendido|enojado|neutral",
      "gesto": "saludo|manos_arriba|mano_levantada|brazo_extendido|brazos_abajo|ninguno"
    }
  ],
  "objetos": [
    {
      "tipo": "persona|bicicleta|coche|perro|gato|etc",
      "movimiento": "se_acerca|se_aleja|estatico|cruzando",
      "direccion": "izquierda|derecha|frente|atras",
      "velocidad": "1.2 m/s|lento|rapido",
      "distancia": "0.5m|1.0m|2.0m|3.0m+"
    }
  ]
}
```

### Eventos del Servidor

#### `ai-description`
Recibe descripciones generadas por IA.

**Estructura de respuesta:**
```json
{
  "description": "Persona feliz saludando izquierda",
  "timestamp": 1699123456789,
  "dataUsed": {
    "personas": [...],
    "objetos": [...],
    "totalDatos": 10
  },
  "fallback": false
}
```

#### `error`
Recibe errores del servidor.

```json
{
  "message": "Error procesando datos"
}
```

## 🌐 Endpoints REST

### GET `/`
Información del servidor.

**Respuesta:**
```json
{
  "name": "InteLeVision Backend",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "clients": 2
}
```

### GET `/health`
Estado de salud del servidor.

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 123456789,
    "external": 12345
  },
  "clients": 2
}
```

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `OPENAI_API_KEY` | Clave de API de OpenAI | Requerida |
| `PORT` | Puerto del servidor | 3001 |
| `NODE_ENV` | Entorno de ejecución | development |
| `LOG_LEVEL` | Nivel de logging | info |
| `AGGREGATION_WINDOW_MS` | Ventana de agregación (ms) | 2000 |
| `MAX_AGGREGATION_SIZE` | Máximo tamaño de buffer | 50 |

## 🔧 Funcionamiento

### Flujo de Datos

1. **Recepción**: El frontend envía datos cada 200ms vía WebSocket
2. **Agregación**: El backend acumula datos durante 2 segundos
3. **Procesamiento**: Se crea un resumen estadístico de los datos
4. **IA**: OpenAI analiza y genera descripción de máximo 5 palabras
5. **Respuesta**: Se envía la descripción al frontend vía WebSocket
6. **Fallback**: Si OpenAI falla, se usa sistema de respuestas predefinidas

### Priorización de Datos

1. **Personas** (máxima prioridad)
   - Expresiones faciales
   - Gestos
   - Posición y distancia

2. **Objetos en movimiento** (prioridad media)
   - Vehículos
   - Animales
   - Dirección y velocidad

3. **Objetos estáticos** (prioridad baja)
   - Obstáculos
   - Elementos del entorno

## 🐛 Debugging

### Logs

El servidor genera logs detallados con timestamps:

```
[2024-01-15T10:30:00.000Z] [INFO] 🚀 InteLeVision Backend iniciado en puerto 3001
[2024-01-15T10:30:01.000Z] [INFO] Cliente conectado: abc123
[2024-01-15T10:30:02.000Z] [DEBUG] Datos recibidos de abc123: {"timestamp":1699123456789,"personas":[...]}
[2024-01-15T10:30:04.000Z] [INFO] Procesando 10 muestras para cliente abc123
[2024-01-15T10:30:04.500Z] [INFO] Respuesta generada: "Persona feliz saludando izquierda" (fallback: false)
```

### Niveles de Log

- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Información detallada

## 🔒 Seguridad

- CORS configurado para desarrollo (permitir todos los orígenes)
- Validación de datos de entrada
- Manejo de errores robusto
- Variables de entorno para configuración sensible

## 📊 Monitoreo

### Métricas Disponibles

- Número de clientes conectados
- Tiempo de actividad del servidor
- Uso de memoria
- Estadísticas de procesamiento

### Health Check

```bash
curl http://localhost:3001/health
```

## 🤝 Integración con Frontend

### Ejemplo de conexión desde Angular/Ionic

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Enviar datos de sensores
socket.emit('sensor-data', {
  timestamp: Date.now(),
  personas: [...],
  objetos: [...]
});

// Recibir descripciones de IA
socket.on('ai-description', (response) => {
  console.log('Descripción:', response.description);
  // Procesar respuesta para el usuario
});

// Manejar errores
socket.on('error', (error) => {
  console.error('Error del servidor:', error.message);
});
```

## 🚨 Solución de Problemas

### Error: "OpenAI API key not configured"
- Verifica que `OPENAI_API_KEY` esté configurada en `.env`
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto

### Error: "Port already in use"
- Cambia el puerto en `.env` o detén otros servicios
- Usa `netstat -ano | findstr :3001` para identificar procesos

### WebSocket no conecta
- Verifica que el servidor esté ejecutándose
- Confirma la URL del WebSocket en el frontend
- Revisa logs del servidor para errores

### Respuestas muy lentas
- Verifica la conexión a internet
- Revisa logs de OpenAI para errores de API
- Considera ajustar `AGGREGATION_WINDOW_MS`

## 📝 Licencia

MIT License - Ver archivo LICENSE para detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

---

**InteLeVision** - Haciendo el mundo más accesible, una descripción a la vez. 🌍👁️ 