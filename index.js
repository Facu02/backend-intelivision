const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const BedrockAgentManager = require('./bedrock-agent');
const bedrockAgent = new BedrockAgentManager();

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


// Variables de configuración
const PORT = process.env.PORT || 3001;
const AGGREGATION_WINDOW_MS = parseInt(process.env.AGGREGATION_WINDOW_MS) || 2000;
const MAX_AGGREGATION_SIZE = parseInt(process.env.MAX_AGGREGATION_SIZE) || 50;

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento de datos agregados por cliente
const clientData = new Map();

// Almacenamiento de última información enviada por cliente (para filtrado)
const lastSentData = new Map();

// Función de logging mejorada
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
}

// Función para limpiar datos antiguos
function cleanupOldData() {
  const now = Date.now();
  
  // Limpiar datos de sensores
  for (const [clientId, data] of clientData.entries()) {
    data.sensorData = data.sensorData.filter(item => 
      now - item.timestamp < AGGREGATION_WINDOW_MS
    );
    
    if (data.sensorData.length === 0) {
      clientData.delete(clientId);
    }
  }
  
  // Limpiar datos de último envío (más de 1 minuto)
  const ONE_MINUTE = 60000;
  for (const [clientId, data] of lastSentData.entries()) {
    if (now - data.timestamp > ONE_MINUTE) {
      lastSentData.delete(clientId);
    }
  }
}

// Función para agregar datos de sensores
function aggregateSensorData(clientId, newData) {
  if (!clientData.has(clientId)) {
    clientData.set(clientId, {
      sensorData: [],
      lastProcessed: 0
    });
  }

  const client = clientData.get(clientId);
  
  // Agregar timestamp si no existe
  if (!newData.timestamp) {
    newData.timestamp = Date.now();
  }

  // Agregar datos nuevos
  client.sensorData.push(newData);

  // Limitar tamaño del buffer
  if (client.sensorData.length > MAX_AGGREGATION_SIZE) {
    client.sensorData = client.sensorData.slice(-MAX_AGGREGATION_SIZE);
  }

  // Limpiar datos antiguos
  const now = Date.now();
  client.sensorData = client.sensorData.filter(item => 
    now - item.timestamp < AGGREGATION_WINDOW_MS
  );

  return client.sensorData;
}

// Función para crear resumen estadístico de datos con blendshapes
function createDataSummary(sensorData) {
  if (!sensorData || sensorData.length === 0) {
    return { personas: [], objetos: [], totalDatos: 0 };
  }

  const personas = [];
  const objetos = [];
  const personasMap = new Map();
  const objetosMap = new Map();

  // Procesar cada conjunto de datos
  sensorData.forEach(data => {
    // Procesar personas con blendshapes
    if (data.personas && Array.isArray(data.personas)) {
      data.personas.forEach(persona => {
        // Crear clave única incluyendo blendshapes significativos
        const blendshapesKey = getBlendshapesKey(persona.blendshapes);
        const key = `${persona.posicion}-${persona.expresion}-${persona.gesto}-${blendshapesKey}`;
        
        if (personasMap.has(key)) {
          const existing = personasMap.get(key);
          existing.count++;
          // Promediar blendshapes
          existing.blendshapes = mergeBlendshapes(existing.blendshapes, persona.blendshapes);
        } else {
          personasMap.set(key, { 
            ...persona, 
            count: 1,
            blendshapes: persona.blendshapes || []
          });
        }
      });
    }

    // Procesar objetos (traducir tipos del inglés al español)
    if (data.objetos && Array.isArray(data.objetos)) {
      data.objetos.forEach(objeto => {
        const tipoTraducido = translateObjectType(objeto.tipo);
        const key = `${tipoTraducido}-${objeto.movimiento}-${objeto.direccion}`;
        
        if (objetosMap.has(key)) {
          const existing = objetosMap.get(key);
          existing.count++;
          // Mantener el tipo original y traducido
          existing.tipoOriginal = objeto.tipo;
          existing.tipo = tipoTraducido;
        } else {
          objetosMap.set(key, { 
            ...objeto, 
            tipoOriginal: objeto.tipo,
            tipo: tipoTraducido,
            count: 1 
          });
        }
      });
    }
  });

  // Convertir mapas a arrays
  personasMap.forEach((persona, key) => {
    personas.push(persona);
  });

  objetosMap.forEach((objeto, key) => {
    objetos.push(objeto);
  });

  return {
    personas: personas.sort((a, b) => b.count - a.count),
    objetos: objetos.sort((a, b) => b.count - a.count),
    totalDatos: sensorData.length
  };
}

// Función para obtener clave de blendshapes significativos
function getBlendshapesKey(blendshapes) {
  if (!blendshapes || !Array.isArray(blendshapes)) return 'none';
  
  // Filtrar blendshapes con score > 0.3 y crear clave
  const significant = blendshapes
    .filter(bs => bs.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 más significativos
    .map(bs => `${bs.name}:${Math.round(bs.score * 100)}`);
  
  return significant.length > 0 ? significant.join('|') : 'none';
}

// Función para combinar blendshapes (promedio)
function mergeBlendshapes(existing, newBlendshapes) {
  if (!existing || !newBlendshapes) return newBlendshapes || existing;
  
  const merged = new Map();
  
  // Agregar existentes
  existing.forEach(bs => {
    merged.set(bs.name, { name: bs.name, score: bs.score, count: 1 });
  });
  
  // Combinar con nuevos
  newBlendshapes.forEach(bs => {
    if (merged.has(bs.name)) {
      const existing = merged.get(bs.name);
      existing.score = (existing.score + bs.score) / (existing.count + 1);
      existing.count++;
    } else {
      merged.set(bs.name, { name: bs.name, score: bs.score, count: 1 });
    }
  });
  
  return Array.from(merged.values()).map(bs => ({
    name: bs.name,
    score: bs.score
  }));
}

// Función para traducir tipos de objetos
function translateObjectType(tipo) {
  const translations = {
    'car': 'coche',
    'bicycle': 'bicicleta',
    'motorcycle': 'moto',
    'bus': 'autobús',
    'truck': 'camión',
    'dog': 'perro',
    'cat': 'gato',
    'person': 'persona',
    'chair': 'silla',
    'table': 'mesa',
    'cup': 'taza',
    'bottle': 'botella',
    'book': 'libro',
    'phone': 'teléfono',
    'laptop': 'portátil'
  };
  
  return translations[tipo] || tipo;
}



// Función para generar respuesta fallback especializada en emociones y blendshapes
function generateFallbackResponse(dataSummary) {
  const { personas, objetos } = dataSummary;

  // Priorizar personas con enfoque emocional y blendshapes
  if (personas.length > 0) {
    const persona = personas[0];
    
    // Analizar blendshapes para micro-expresiones
    const microExpresion = getMicroExpressionFromBlendshapes(persona.blendshapes);
    
    // Combinar emoción con gesto significativo y micro-expresión
    if (persona.gesto !== 'ninguno') {
      const gestoEmocional = getEmotionalGesture(persona.gesto, persona.expresion);
      if (microExpresion) {
        return `${microExpresion} ${persona.posicion}`;
      }
      return `${gestoEmocional} ${persona.posicion}`;
    }
    
    // Combinar emoción con micro-expresión
    if (microExpresion) {
      return `${microExpresion} ${persona.posicion}`;
    }
    
    // Solo emoción
    const emocionDesc = getEmotionalDescription(persona.expresion);
    return `${emocionDesc} ${persona.posicion}`;
  }

  // Objetos en movimiento con urgencia
  const objetosEnMovimiento = objetos.filter(obj => 
    obj.movimiento !== 'estatico'
  );
  
  if (objetosEnMovimiento.length > 0) {
    const objeto = objetosEnMovimiento[0];
    const urgencia = getUrgencyLevel(objeto.movimiento, objeto.tipo);
    return `${objeto.tipo} ${urgencia} ${objeto.direccion}`;
  }

  // Objetos estáticos
  if (objetos.length > 0) {
    const objeto = objetos[0];
    return `${objeto.tipo} ${objeto.direccion}`;
  }

  return "";
}

// Funciones auxiliares para el fallback emocional
function getEmotionalDescription(expresion) {
  const emociones = {
    'feliz': 'Persona alegre',
    'triste': 'Alguien triste',
    'sorprendido': 'Persona asombrada',
    'enojado': 'Persona molesta',
    'neutral': 'Persona calmada'
  };
  return emociones[expresion] || `Persona ${expresion}`;
}

function getEmotionalGesture(gesto, expresion) {
  const gestosEmocionales = {
    'saludo': expresion === 'feliz' ? 'Saludo alegre' : 'Saludo',
    'manos_arriba': expresion === 'feliz' ? 'Celebrando' : 'Pidiendo ayuda',
    'mano_levantada': 'Pidiendo atención',
    'brazo_extendido': 'Señalando dirección',
    'brazos_abajo': 'Relajada',
    'ninguno': getEmotionalDescription(expresion)
  };
  return gestosEmocionales[gesto] || gesto;
}

function getUrgencyLevel(movimiento, tipo) {
  if (movimiento === 'se_acerca') return 'acercándose';
  if (movimiento === 'rapido') return 'rápido';
  if (tipo === 'coche' || tipo === 'bicicleta') return 'pasando';
  return movimiento;
}

// Función para extraer micro-expresiones de blendshapes
function getMicroExpressionFromBlendshapes(blendshapes) {
  if (!blendshapes || !Array.isArray(blendshapes) || blendshapes.length === 0) {
    return null;
  }

  // Filtrar blendshapes significativos (score > 0.4)
  const significant = blendshapes
    .filter(bs => bs.score > 0.4)
    .sort((a, b) => b.score - a.score);

  if (significant.length === 0) return null;

  // Buscar patrones de micro-expresiones
  const patterns = {
    // Sonrisa genuina
    smile: ['mouthSmile_L', 'mouthSmile_R', 'cheekSquint_L', 'cheekSquint_R'],
    // Sorpresa
    surprise: ['browInnerUp', 'browOuterUp_L', 'browOuterUp_R', 'eyeWide_L', 'eyeWide_R'],
    // Tristeza
    sadness: ['mouthFrown_L', 'mouthFrown_R', 'browDown_L', 'browDown_R'],
    // Enojo
    anger: ['browDown_L', 'browDown_R', 'noseSneer_L', 'noseSneer_R'],
    // Concentración
    concentration: ['eyeSquint_L', 'eyeSquint_R', 'browDown_L', 'browDown_R']
  };

  // Contar coincidencias por patrón
  const patternCounts = {};
  Object.keys(patterns).forEach(pattern => {
    patternCounts[pattern] = 0;
    patterns[pattern].forEach(blendName => {
      if (significant.some(bs => bs.name === blendName)) {
        patternCounts[pattern]++;
      }
    });
  });

  // Encontrar el patrón más fuerte
  let bestPattern = null;
  let maxCount = 0;
  Object.keys(patternCounts).forEach(pattern => {
    if (patternCounts[pattern] > maxCount) {
      maxCount = patternCounts[pattern];
      bestPattern = pattern;
    }
  });

  // Retornar descripción de micro-expresión
  if (bestPattern && maxCount >= 2) {
    const microExpressions = {
      'smile': 'sonriendo genuinamente',
      'surprise': 'asombrada ojos abiertos',
      'sadness': 'triste cejas bajas',
      'anger': 'molesta cejas fruncidas',
      'concentration': 'concentrada mirando'
    };
    return microExpressions[bestPattern];
  }

  // Si no hay patrón claro, usar el blendshape más fuerte
  const strongest = significant[0];
  const descriptions = {
    'mouthSmile_L': 'sonriendo ligeramente',
    'mouthSmile_R': 'sonriendo ligeramente',
    'browInnerUp': 'cejas levantadas',
    'browOuterUp_L': 'ceja izquierda levantada',
    'browOuterUp_R': 'ceja derecha levantada',
    'eyeWide_L': 'ojo izquierdo abierto',
    'eyeWide_R': 'ojo derecho abierto',
    'mouthOpen': 'boca abierta',
    'eyeBlink_L': 'parpadeando',
    'eyeBlink_R': 'parpadeando'
  };

  return descriptions[strongest.name] || null;
}

// Función para verificar si los datos son relevantes (filtrado previo)
function isDataRelevant(dataSummary, clientId) {
  const { personas, objetos, totalDatos } = dataSummary;
  
  // Si no hay datos o muy pocos datos, no es relevante
  if (totalDatos === 0 || (personas.length === 0 && objetos.length === 0)) {
    log(`Filtrado previo: Sin datos relevantes (personas: ${personas.length}, objetos: ${objetos.length})`, 'debug');
    return false;
  }
  
  // Obtener últimos datos enviados para este cliente
  const lastData = lastSentData.get(clientId);
  
  // Si es la primera vez, es relevante
  if (!lastData) {
    return true;
  }
  
  // Verificar cambios significativos en personas
  if (personas.length !== lastData.personas.length) {
    return true;
  }
  
  // Verificar cambios en expresiones o gestos importantes
  const hasSignificantPersonChange = personas.some(persona => {
    const lastPersona = lastData.personas.find(p => p.posicion === persona.posicion);
    if (!lastPersona) return true;
    
    return (
      persona.expresion !== lastPersona.expresion ||
      persona.gesto !== lastPersona.gesto ||
      persona.distancia !== lastPersona.distancia
    );
  });
  
  // Verificar cambios en objetos (especialmente vehículos en movimiento)
  const hasSignificantObjectChange = objetos.some(objeto => {
    const lastObjeto = lastData.objetos.find(o => o.tipo === objeto.tipo);
    if (!lastObjeto) return true;
    
    // Objetos en movimiento son más relevantes
    if (objeto.movimiento === 'se_acerca' || objeto.movimiento === 'cruzando') {
      return true;
    }
    
    return (
      objeto.movimiento !== lastObjeto.movimiento ||
      objeto.direccion !== lastObjeto.direccion
    );
  });
  
  return hasSignificantPersonChange || hasSignificantObjectChange;
}

// Función para procesar datos agregados
async function processAggregatedData(clientId, sensorData) {
  try {
    log(`Procesando ${sensorData.length} muestras para cliente ${clientId}`, 'info');
    
    const dataSummary = createDataSummary(sensorData);
    
    // Filtrado previo: verificar si los datos son relevantes
    if (!isDataRelevant(dataSummary, clientId)) {
      log(`Datos no relevantes para cliente ${clientId}, omitiendo procesamiento`, 'debug');
      return null; // No procesar ni enviar
    }
    
    let description;
    let fallback = false;

    // Usar Bedrock Agent con filtrado inteligente
    try {
      log('Enviando solicitud a Bedrock Agent...', 'debug');
      description = await bedrockAgent.analyzeSensorData(dataSummary);
      log(`Respuesta de Bedrock Agent: "${description}"`, 'debug');
      
      // Verificar si el LLM considera la información no relevante
      if (description === '' || 
          description === '""' || 
          description.toLowerCase().includes('[información no relevante]') || 
          description.toLowerCase().includes('[no relevante]') ||
          description.toLowerCase().includes('no relevante') ||
          description.toLowerCase().includes('camino libre') ||
          description.toLowerCase().includes('todo tranquilo') ||
          description.toLowerCase().includes('área libre')) {
        log(`LLM marcó información como no relevante para cliente ${clientId}: "${description}"`, 'debug');
        return null; // No enviar al cliente
      }
      
    } catch (error) {
      log('Usando respuesta fallback debido a error de Bedrock Agent', 'warn');
      log(`Error Bedrock Agent: ${error && error.message ? error.message : error}`, 'error');
      if (error && error.stack) {
        log(`Stack Bedrock Agent: ${error.stack}`, 'debug');
      }
      description = generateFallbackResponse(dataSummary);
      fallback = true;
      
      // Verificar también si la respuesta fallback es no relevante
      if (description === '' || 
          description === '""' || 
          description.toLowerCase().includes('[información no relevante]') || 
          description.toLowerCase().includes('camino libre') ||
          description.toLowerCase().includes('todo tranquilo') ||
          description.toLowerCase().includes('área libre')) {
        log(`Fallback marcó información como no relevante para cliente ${clientId}: "${description}"`, 'debug');
        return null; // No enviar al cliente
      }
    }

    // Almacenar datos enviados para filtrado futuro
    lastSentData.set(clientId, {
      personas: dataSummary.personas,
      objetos: dataSummary.objetos,
      timestamp: Date.now()
    });

    const response = {
      description: description,
      timestamp: Date.now(),
      dataUsed: dataSummary,
      fallback: fallback
    };

    log(`Respuesta generada: "${description}" (fallback: ${fallback})`, 'info');
    log(`Respuesta completa: ${JSON.stringify(response)}`, 'debug');
    return response;

  } catch (error) {
    log(`Error procesando datos: ${error.message}`, 'error');
    throw error;
  }
}

// Endpoints REST
app.get('/', (req, res) => {
  res.json({
    name: 'InteLeVision Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    clients: clientData.size
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    clients: clientData.size
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  const clientId = socket.id;
  log(`Cliente conectado: ${clientId}`, 'info');

  // Configurar heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Manejar datos de sensores
  socket.on('sensor-data', async (data) => {
    try {
      log(`Datos recibidos de ${clientId}: ${JSON.stringify(data).substring(0, 100)}...`, 'debug');
      
      // Validar datos
      if (!data || typeof data !== 'object') {
        log(`Datos inválidos recibidos de ${clientId}`, 'warn');
        return;
      }

      // Agregar datos
      const aggregatedData = aggregateSensorData(clientId, data);
      
      // Verificar si es momento de procesar
      const client = clientData.get(clientId);
      const now = Date.now();
      
      if (now - client.lastProcessed >= AGGREGATION_WINDOW_MS && aggregatedData.length > 0) {
        client.lastProcessed = now;
        
        // Procesar datos
        const response = await processAggregatedData(clientId, aggregatedData);
        
        // Solo enviar respuesta si es relevante (no null)
        if (response) {
          socket.emit('ai-description', response);
          log(`Respuesta enviada a ${clientId}: "${response.description}"`, 'info');
        } else {
          log(`Respuesta omitida para ${clientId}: información no relevante`, 'debug');
        }
        
        // Limpiar datos procesados
        client.sensorData = [];
      }

    } catch (error) {
      log(`Error procesando datos de ${clientId}: ${error.message}`, 'error');
      socket.emit('error', { message: 'Error procesando datos' });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    log(`Cliente desconectado: ${clientId}`, 'info');
    clientData.delete(clientId);
    lastSentData.delete(clientId);
  });

  // Manejar errores de socket
  socket.on('error', (error) => {
    log(`Error de socket en ${clientId}: ${error.message}`, 'error');
  });
});

// Limpieza periódica de datos
setInterval(cleanupOldData, 5000);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  log(`Error no capturado: ${error.message}`, 'error');
  log(error.stack, 'error');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Promesa rechazada no manejada: ${reason}`, 'error');
});

// Iniciar servidor
server.listen(PORT, () => {
  log(`🚀 InteLeVision Backend iniciado en puerto ${PORT}`, 'info');
  log(`📡 WebSocket disponible en ws://localhost:${PORT}`, 'info');
  log(`🌐 Servidor HTTP disponible en http://localhost:${PORT}`, 'info');
  log(`⏱️  Ventana de agregación: ${AGGREGATION_WINDOW_MS}ms`, 'info');
  log(`🔑 OpenAI configurado: ${process.env.OPENAI_API_KEY ? 'Sí' : 'No'}`, 'info');
});

module.exports = { app, server, io }; 