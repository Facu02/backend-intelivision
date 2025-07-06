# InteLeVision Backend - Documentación Técnica

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Servidor Express** - Manejo de endpoints REST
2. **Socket.io** - Comunicación WebSocket en tiempo real
3. **Sistema de Agregación** - Acumulación de datos durante 2 segundos
4. **Integración OpenAI** - Procesamiento de IA
5. **Sistema de Fallback** - Respuestas predefinidas

### Flujo de Datos Detallado

```
Frontend (Angular/Ionic)
    ↓ (200ms)
WebSocket (Socket.io)
    ↓
Sistema de Agregación (2s)
    ↓
Procesamiento de Datos
    ↓
OpenAI API (GPT-3.5-turbo)
    ↓
Respuesta (máx. 5 palabras)
    ↓
WebSocket → Frontend
```

## 📊 Algoritmo de Agregación

### Ventana de Tiempo
- **Duración**: 2000ms (2 segundos)
- **Frecuencia de entrada**: 200ms (5 FPS)
- **Muestras esperadas**: ~10 por ventana

### Estrategia de Agregación

```javascript
// Pseudocódigo del algoritmo
function aggregateData(clientId, newData) {
  // 1. Obtener buffer del cliente
  const buffer = getClientBuffer(clientId);
  
  // 2. Agregar nuevos datos
  buffer.push(newData);
  
  // 3. Limpiar datos antiguos (> 2s)
  buffer = buffer.filter(data => 
    now - data.timestamp < 2000ms
  );
  
  // 4. Limitar tamaño máximo
  if (buffer.length > 50) {
    buffer = buffer.slice(-50);
  }
  
  return buffer;
}
```

### Resumen Estadístico

```javascript
// Estructura del resumen
{
  personas: [
    {
      posicion: "frente",
      expresion: "feliz", 
      gesto: "saludo",
      distancia: "1.2m",
      count: 5  // Frecuencia de detección
    }
  ],
  objetos: [
    {
      tipo: "coche",
      movimiento: "se_acerca",
      direccion: "derecha",
      velocidad: "rapido",
      distancia: "2.0m",
      count: 3
    }
  ],
  totalDatos: 10
}
```

## 🤖 Integración con OpenAI

### Prompt Engineering

El prompt está diseñado para:
- **Contexto claro**: Especifica el rol de InteLeVision
- **Instrucciones específicas**: Máximo 5 palabras
- **Priorización**: Personas > Objetos en movimiento > Objetos estáticos
- **Ejemplos concretos**: Casos de uso reales

### Configuración de la API

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "Eres InteLeVision, un asistente de visión para personas con discapacidad visual. Responde siempre en máximo 5 palabras descriptivas."
    },
    {
      role: "user", 
      content: prompt
    }
  ],
  max_tokens: 20,      // Limitar longitud
  temperature: 0.7     // Balance entre creatividad y consistencia
});
```

### Sistema de Fallback

```javascript
function generateFallbackResponse(dataSummary) {
  const { personas, objetos } = dataSummary;
  
  // Prioridad 1: Personas con gestos
  if (personas.length > 0 && personas[0].gesto !== 'ninguno') {
    return `Persona ${personas[0].gesto} ${personas[0].posicion}`;
  }
  
  // Prioridad 2: Personas con expresiones
  if (personas.length > 0) {
    return `Persona ${personas[0].expresion} ${personas[0].posicion}`;
  }
  
  // Prioridad 3: Objetos en movimiento
  const objetosEnMovimiento = objetos.filter(obj => obj.movimiento !== 'estatico');
  if (objetosEnMovimiento.length > 0) {
    return `${objetosEnMovimiento[0].tipo} ${objetosEnMovimiento[0].movimiento} ${objetosEnMovimiento[0].direccion}`;
  }
  
  // Prioridad 4: Objetos estáticos
  if (objetos.length > 0) {
    return `${objetos[0].tipo} ${objetos[0].direccion}`;
  }
  
  // Fallback final
  return "Camino libre tranquilo";
}
```

## 🔧 Gestión de Estado

### Almacenamiento de Clientes

```javascript
// Estructura del Map de clientes
const clientData = new Map();

// Cada cliente tiene:
{
  sensorData: [],      // Buffer de datos
  lastProcessed: 0     // Timestamp del último procesamiento
}
```

### Limpieza Automática

```javascript
// Ejecutado cada 5 segundos
function cleanupOldData() {
  const now = Date.now();
  
  for (const [clientId, data] of clientData.entries()) {
    // Eliminar datos antiguos
    data.sensorData = data.sensorData.filter(item => 
      now - item.timestamp < AGGREGATION_WINDOW_MS
    );
    
    // Eliminar cliente si no tiene datos
    if (data.sensorData.length === 0) {
      clientData.delete(clientId);
    }
  }
}
```

## 📡 Protocolo WebSocket

### Eventos del Cliente

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `sensor-data` | Envía datos de sensores | `{timestamp, personas[], objetos[]}` |
| `ping` | Heartbeat | - |

### Eventos del Servidor

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `ai-description` | Respuesta de IA | `{description, timestamp, dataUsed, fallback}` |
| `error` | Error del servidor | `{message}` |
| `pong` | Respuesta heartbeat | - |

### Manejo de Conexiones

```javascript
io.on('connection', (socket) => {
  const clientId = socket.id;
  
  // Configurar heartbeat
  socket.on('ping', () => socket.emit('pong'));
  
  // Procesar datos
  socket.on('sensor-data', async (data) => {
    // Validación
    if (!data || typeof data !== 'object') return;
    
    // Agregación
    const aggregatedData = aggregateSensorData(clientId, data);
    
    // Procesamiento cada 2 segundos
    const client = clientData.get(clientId);
    const now = Date.now();
    
    if (now - client.lastProcessed >= 2000 && aggregatedData.length > 0) {
      const response = await processAggregatedData(clientId, aggregatedData);
      socket.emit('ai-description', response);
      client.sensorData = []; // Limpiar buffer
    }
  });
  
  // Limpieza al desconectar
  socket.on('disconnect', () => {
    clientData.delete(clientId);
  });
});
```

## 🔒 Seguridad y Validación

### Validación de Datos

```javascript
// Validación básica
if (!data || typeof data !== 'object') {
  log(`Datos inválidos recibidos de ${clientId}`, 'warn');
  return;
}

// Validación de estructura
if (!Array.isArray(data.personas) || !Array.isArray(data.objetos)) {
  log(`Estructura de datos inválida de ${clientId}`, 'warn');
  return;
}
```

### Configuración CORS

```javascript
const io = socketIo(server, {
  cors: {
    origin: "*",        // Desarrollo - cambiar en producción
    methods: ["GET", "POST"]
  }
});
```

### Variables de Entorno

```bash
# Requeridas
OPENAI_API_KEY=sk-...

# Opcionales
PORT=3001
NODE_ENV=development
AGGREGATION_WINDOW_MS=2000
MAX_AGGREGATION_SIZE=50
```

## 📈 Monitoreo y Logging

### Niveles de Log

- **ERROR**: Errores críticos que afectan funcionamiento
- **WARN**: Advertencias que no detienen el servicio
- **INFO**: Información general del sistema
- **DEBUG**: Información detallada para desarrollo

### Métricas Disponibles

```javascript
// Endpoint /health
{
  status: "healthy",
  timestamp: "2024-01-15T10:30:00.000Z",
  uptime: 3600.5,                    // Segundos de actividad
  memory: {                          // Uso de memoria
    rss: 123456789,
    heapTotal: 987654321,
    heapUsed: 123456789,
    external: 12345
  },
  clients: 2                         // Clientes conectados
}
```

## 🚀 Optimizaciones

### Rendimiento

1. **Buffer limitado**: Máximo 50 muestras por cliente
2. **Limpieza automática**: Eliminación de datos antiguos
3. **Procesamiento asíncrono**: No bloquea la recepción de datos
4. **Heartbeat**: Detección de conexiones perdidas

### Escalabilidad

1. **Estado por cliente**: Cada cliente tiene su propio buffer
2. **Sin estado global**: Fácil escalado horizontal
3. **Configuración flexible**: Variables de entorno
4. **Logging estructurado**: Fácil monitoreo

## 🐛 Debugging

### Logs de Desarrollo

```bash
# Activar logs detallados
LOG_LEVEL=debug npm start

# Ver logs en tiempo real
tail -f logs/app.log
```

### Herramientas de Prueba

1. **Cliente de prueba**: `node test-client.js`
2. **Health check**: `curl http://localhost:3001/health`
3. **WebSocket tester**: Herramientas del navegador

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `OPENAI_API_KEY not configured` | Variable de entorno faltante | Configurar en `.env` |
| `Port already in use` | Puerto ocupado | Cambiar puerto o detener servicio |
| `WebSocket connection failed` | Servidor no iniciado | Verificar que el servidor esté corriendo |
| `Rate limit exceeded` | Demasiadas llamadas a OpenAI | Aumentar `AGGREGATION_WINDOW_MS` |

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas

1. **Persistencia de datos**: Base de datos para historial
2. **Múltiples modelos de IA**: Elección de modelo según contexto
3. **Análisis de tendencias**: Detección de patrones
4. **Configuración dinámica**: Cambios sin reinicio
5. **Métricas avanzadas**: Dashboard de monitoreo

### Optimizaciones Técnicas

1. **Caché de respuestas**: Evitar llamadas repetidas a OpenAI
2. **Compresión WebSocket**: Reducir ancho de banda
3. **Load balancing**: Distribución de carga
4. **Microservicios**: Separación de responsabilidades
5. **Docker**: Containerización para despliegue

---

*Documentación técnica v1.0 - InteLeVision Backend* 