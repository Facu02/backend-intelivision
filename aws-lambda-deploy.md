# 🏗️ Guía de Deploy en AWS Lambda + API Gateway WebSocket

## ⚠️ Importante
Esta opción es más compleja y requiere refactoring del código. **Recomendamos Railway para empezar**.

## 🔧 Arquitectura AWS

```
Cliente -> API Gateway WebSocket -> Lambda -> Bedrock Agent
```

## Paso 1: Refactoring necesario

### 1.1 Separar funciones
El código actual usa Socket.IO y servidor HTTP continuo. Para Lambda necesitamos:

- **Lambda Connect**: Manejar conexiones WebSocket
- **Lambda Disconnect**: Manejar desconexiones  
- **Lambda Message**: Procesar mensajes
- **Lambda Authorizer**: (opcional) Autenticación

### 1.2 Estructura de archivos
```
aws-lambda/
├── connect/
│   └── handler.js
├── disconnect/
│   └── handler.js
├── message/
│   └── handler.js
├── shared/
│   ├── bedrock-agent.js
│   └── utils.js
└── serverless.yml
```

## Paso 2: Configurar Serverless Framework

### 2.1 Instalar Serverless
```bash
npm install -g serverless
npm install serverless-offline serverless-dotenv-plugin
```

### 2.2 Configurar serverless.yml
```yaml
service: intelivision-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    BEDROCK_AGENT_ID: ${env:BEDROCK_AGENT_ID}
    BEDROCK_AGENT_ALIAS_ID: ${env:BEDROCK_AGENT_ALIAS_ID}
    AGGREGATION_WINDOW_MS: ${env:AGGREGATION_WINDOW_MS, '2000'}
    MAX_AGGREGATION_SIZE: ${env:MAX_AGGREGATION_SIZE, '50'}
  
  iamRoleStatements:
    - Effect: Allow
      Action:
        - bedrock:InvokeAgent
        - execute-api:ManageConnections
      Resource: "*"
    - Effect: Allow
      Action:
        - dynamodb:PutItem
        - dynamodb:GetItem
        - dynamodb:DeleteItem
        - dynamodb:Query
      Resource: 
        - "arn:aws:dynamodb:us-east-1:*:table/websocket-connections"
        - "arn:aws:dynamodb:us-east-1:*:table/sensor-data"

functions:
  connect:
    handler: connect/handler.connect
    events:
      - websocket:
          route: $connect
  
  disconnect:
    handler: disconnect/handler.disconnect
    events:
      - websocket:
          route: $disconnect
  
  message:
    handler: message/handler.message
    events:
      - websocket:
          route: sensor-data

resources:
  Resources:
    ConnectionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: websocket-connections
        AttributeDefinitions:
          - AttributeName: connectionId
            AttributeType: S
        KeySchema:
          - AttributeName: connectionId
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
    
    SensorDataTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: sensor-data
        AttributeDefinitions:
          - AttributeName: connectionId
            AttributeType: S
          - AttributeName: timestamp
            AttributeType: N
        KeySchema:
          - AttributeName: connectionId
            KeyType: HASH
          - AttributeName: timestamp
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
```

## Paso 3: Refactoring del código

### 3.1 Connect Handler
```javascript
// connect/handler.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.connect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  try {
    await dynamodb.put({
      TableName: 'websocket-connections',
      Item: {
        connectionId,
        timestamp: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      }
    }).promise();
    
    return {
      statusCode: 200,
      body: 'Connected'
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 3.2 Message Handler
```javascript
// message/handler.js
const AWS = require('aws-sdk');
const BedrockAgent = require('../shared/bedrock-agent');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const apiGateway = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

exports.message = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const data = JSON.parse(event.body);
  
  try {
    // Procesar datos (lógica similar a tu código actual)
    const bedrockAgent = new BedrockAgent();
    const response = await bedrockAgent.analyzeSensorData(data);
    
    // Enviar respuesta via WebSocket
    if (response && response.trim() !== '') {
      await apiGateway.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: 'ai-description',
          data: response
        })
      }).promise();
    }
    
    return {
      statusCode: 200,
      body: 'Message processed'
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Paso 4: Deploy

### 4.1 Configurar credenciales AWS
```bash
aws configure
# Ingresa tus credenciales
```

### 4.2 Deploy
```bash
serverless deploy
```

### 4.3 Obtener URL WebSocket
```bash
# El deploy te dará una URL como:
# wss://abc123.execute-api.us-east-1.amazonaws.com/dev
```

## Paso 5: Costos estimados

### 5.1 Tier gratuito (primer año)
- **API Gateway**: 1M mensajes gratis
- **Lambda**: 1M invocaciones + 400,000 GB-segundos
- **DynamoDB**: 25GB almacenamiento + 200M requests
- **Bedrock**: Según uso del agente

### 5.2 Después del tier gratuito
- **API Gateway**: ~$1.00 por millón de mensajes
- **Lambda**: ~$0.20 por millón de invocaciones
- **DynamoDB**: ~$0.25 por GB por mes
- **Bedrock**: Variable según uso

## 🎯 Ventajas vs Desventajas

### ✅ Ventajas
- **Altamente escalable** automáticamente
- **Pago por uso** real
- **Integración nativa** con Bedrock
- **Infraestructura managed**

### ❌ Desventajas
- **Más complejo** de configurar
- **Requiere refactoring** significativo
- **Cold starts** pueden ser lentos
- **Debugging** más difícil

## 🚀 Recomendación

Para tu caso específico, **sugiero empezar con Railway** porque:

1. **Tiempo de desarrollo**: Railway = 10 minutos vs AWS Lambda = 2-3 días
2. **Complejidad**: Railway = Simple vs AWS Lambda = Complejo
3. **Debugging**: Railway = Fácil vs AWS Lambda = Difícil
4. **Mantenimiento**: Railway = Mínimo vs AWS Lambda = Más trabajo

**Puedes migrar a AWS Lambda después** si necesitas más escalabilidad. 