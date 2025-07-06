const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");

class BedrockAgentManager {
  constructor() {
    // LOG de variables de entorno
    console.log('[BedrockAgent] AgentID:', process.env.BEDROCK_AGENT_ID, 'AliasID:', process.env.BEDROCK_AGENT_ALIAS_ID);

    this.client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.agentId = process.env.BEDROCK_AGENT_ID;
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID;
  }

  async invokeAgent(prompt, sessionId = null) {
    try {
      const input = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: "Prueba",
        inputText: prompt
      };

      const command = new InvokeAgentCommand(input);
      const response = await this.client.send(command);
      
      // Procesar la respuesta del agente
      const chunks = [];
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          chunks.push(new TextDecoder().decode(chunk.chunk.bytes));
        }
      }
      
      const fullResponse = chunks.join('');
      return fullResponse.trim();
      
    } catch (error) {
      console.error('Error invoking Bedrock Agent:', error);
      throw error;
    }
  }

  async analyzeSensorData(dataSummary) {
    const { personas, objetos, totalDatos } = dataSummary;
    
    // Crear prompt estructurado para el agente
    let prompt = `Analiza estos datos de sensores de InteLeVision (${totalDatos} muestras):\n\n`;
    
    if (personas.length > 0) {
      prompt += `PERSONAS DETECTADAS:\n`;
      personas.forEach((persona, index) => {
        const emocion = this.getEmotionDescription(persona.expresion);
        const gesto = this.getGestureDescription(persona.gesto);
        const proximidad = this.getProximityDescription(persona.distancia);
        const blendshapesInfo = this.getBlendshapesAnalysis(persona.blendshapes);
        
        prompt += `- ${persona.count}x: ${persona.posicion} (${proximidad}) - ${emocion} - ${gesto}`;
        if (blendshapesInfo) {
          prompt += `\n  Micro-expresiones: ${blendshapesInfo}`;
        }
        prompt += '\n';
      });
    }

    if (objetos.length > 0) {
      prompt += `OBJETOS DETECTADOS:\n`;
      objetos.forEach((objeto, index) => {
        const urgencia = this.getUrgencyDescription(objeto.movimiento, objeto.tipo);
        prompt += `- ${objeto.count}x: ${objeto.tipo} ${objeto.movimiento} hacia ${objeto.direccion} (${objeto.distancia}) - ${urgencia}\n`;
      });
    }

    if (personas.length === 0 && objetos.length === 0) {
      prompt = "No se detectaron personas ni objetos. Responde: 'Camino libre, todo tranquilo'";
    }

    prompt += `\nProporciona una descripción útil en máximo 5 palabras para una persona con discapacidad visual.`;

    return await this.invokeAgent(prompt);
  }

  // Funciones auxiliares (reutilizadas del código principal)
  getEmotionDescription(expresion) {
    const emociones = {
      'feliz': '😊 Alegre y positiva',
      'triste': '😢 Necesita apoyo',
      'sorprendido': '😲 Asombrada',
      'enojado': '😠 Tensa o molesta',
      'neutral': '😐 Calmada'
    };
    return emociones[expresion] || expresion;
  }

  getGestureDescription(gesto) {
    const gestos = {
      'saludo': '👋 Saludando amistosamente',
      'manos_arriba': '🙌 Celebrando o pidiendo ayuda',
      'mano_levantada': '✋ Pidiendo atención',
      'brazo_extendido': '👉 Señalando dirección',
      'brazos_abajo': '🤷 Relajada',
      'ninguno': '💭 Sin gestos específicos'
    };
    return gestos[gesto] || gesto;
  }

  getProximityDescription(distancia) {
    const proximidades = {
      '0.8m': 'Muy cerca (íntimo)',
      '1.2m': 'Cerca (personal)',
      '2.1m': 'Distancia social',
      '3.0m+': 'Lejos (público)'
    };
    return proximidades[distancia] || distancia;
  }

  getUrgencyDescription(movimiento, tipo) {
    if (movimiento === 'se_acerca') return '⚠️ Requiere atención';
    if (movimiento === 'rapido') return '🚨 Urgente';
    if (tipo === 'coche' || tipo === 'bicicleta') return '🚗 Vehículo';
    return '📦 Objeto';
  }

  getBlendshapesAnalysis(blendshapes) {
    if (!blendshapes || !Array.isArray(blendshapes) || blendshapes.length === 0) {
      return null;
    }

    const significant = blendshapes
      .filter(bs => bs.score > 0.3)
      .sort((a, b) => b.score - a.score);

    if (significant.length === 0) return null;

    const blendshapeDescriptions = significant.map(bs => {
      const description = this.getBlendshapeDescription(bs.name, bs.score);
      return `${description} (${Math.round(bs.score * 100)}%)`;
    });

    return blendshapeDescriptions.join(', ');
  }

  getBlendshapeDescription(name, score) {
    const descriptions = {
      'mouthSmile_L': 'sonrisa izquierda',
      'mouthSmile_R': 'sonrisa derecha',
      'browInnerUp': 'cejas levantadas',
      'browOuterUp_L': 'ceja izquierda levantada',
      'browOuterUp_R': 'ceja derecha levantada',
      'browDown_L': 'ceja izquierda fruncida',
      'browDown_R': 'ceja derecha fruncida',
      'eyeBlink_L': 'parpadeo izquierdo',
      'eyeBlink_R': 'parpadeo derecho',
      'eyeWide_L': 'ojo izquierdo abierto',
      'eyeWide_R': 'ojo derecho abierto',
      'eyeSquint_L': 'ojo izquierdo entrecerrado',
      'eyeSquint_R': 'ojo derecho entrecerrado',
      'mouthFrown_L': 'boca fruncida izquierda',
      'mouthFrown_R': 'boca fruncida derecha',
      'mouthOpen': 'boca abierta',
      'mouthPucker': 'boca fruncida',
      'noseSneer_L': 'nariz arrugada izquierda',
      'noseSneer_R': 'nariz arrugada derecha',
      'cheekPuff': 'mejillas hinchadas',
      'cheekSquint_L': 'mejilla izquierda tensa',
      'cheekSquint_R': 'mejilla derecha tensa',
      'tongueOut': 'lengua fuera',
      'jawOpen': 'mandíbula abierta',
      'jawForward': 'mandíbula hacia adelante',
      'jawLeft': 'mandíbula hacia izquierda',
      'jawRight': 'mandíbula hacia derecha'
    };

    return descriptions[name] || name;
  }
}

module.exports = BedrockAgentManager; 