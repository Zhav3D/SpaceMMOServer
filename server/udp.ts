import dgram from 'dgram';
import { randomUUID } from 'crypto';
import { BinarySerializer, MessageType, MessageHeader } from '@shared/types';
import { Vector3, Quaternion } from '@shared/math';
import { EventEmitter } from 'events';

// Create a binary serializer for efficient network transport
class BinarySerializerImpl implements BinarySerializer {
  serializeVector3(v: Vector3): Buffer {
    const buffer = Buffer.alloc(12); // 3 floats * 4 bytes
    buffer.writeFloatLE(v.x, 0);
    buffer.writeFloatLE(v.y, 4);
    buffer.writeFloatLE(v.z, 8);
    return buffer;
  }

  deserializeVector3(buffer: Buffer, offset: number): { value: Vector3, bytesRead: number } {
    const x = buffer.readFloatLE(offset);
    const y = buffer.readFloatLE(offset + 4);
    const z = buffer.readFloatLE(offset + 8);
    return {
      value: new Vector3(x, y, z),
      bytesRead: 12
    };
  }

  serializeQuaternion(q: Quaternion): Buffer {
    const buffer = Buffer.alloc(16); // 4 floats * 4 bytes
    buffer.writeFloatLE(q.x, 0);
    buffer.writeFloatLE(q.y, 4);
    buffer.writeFloatLE(q.z, 8);
    buffer.writeFloatLE(q.w, 12);
    return buffer;
  }

  deserializeQuaternion(buffer: Buffer, offset: number): { value: Quaternion, bytesRead: number } {
    const x = buffer.readFloatLE(offset);
    const y = buffer.readFloatLE(offset + 4);
    const z = buffer.readFloatLE(offset + 8);
    const w = buffer.readFloatLE(offset + 12);
    return {
      value: new Quaternion(x, y, z, w),
      bytesRead: 16
    };
  }

  serializeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.alloc(2); // Use 2 bytes for string length (up to 65535)
    lengthBuffer.writeUInt16LE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }

  deserializeString(buffer: Buffer, offset: number): { value: string, bytesRead: number } {
    const length = buffer.readUInt16LE(offset);
    const str = buffer.toString('utf8', offset + 2, offset + 2 + length);
    return {
      value: str,
      bytesRead: 2 + length
    };
  }

  serializeMessageHeader(header: MessageHeader): Buffer {
    // Message Type (1 byte) + Sequence Number (4 bytes) + Timestamp (8 bytes)
    const buffer = Buffer.alloc(13);
    buffer.writeUInt8(header.messageType, 0);
    buffer.writeUInt32LE(header.sequence, 1);
    buffer.writeBigUInt64LE(BigInt(header.timestamp), 5);
    
    // Client ID as a string
    const clientIdBuffer = this.serializeString(header.clientId);
    
    return Buffer.concat([buffer, clientIdBuffer]);
  }

  deserializeMessageHeader(buffer: Buffer, offset: number = 0): { value: MessageHeader, bytesRead: number } {
    const messageType = buffer.readUInt8(offset) as MessageType;
    const sequence = buffer.readUInt32LE(offset + 1);
    const timestamp = Number(buffer.readBigUInt64LE(offset + 5));
    
    const clientIdResult = this.deserializeString(buffer, offset + 13);
    
    return {
      value: {
        messageType,
        sequence,
        timestamp,
        clientId: clientIdResult.value
      },
      bytesRead: 13 + clientIdResult.bytesRead
    };
  }

  serializeEntityState(entity: any): Buffer {
    const entityIdBuffer = this.serializeString(entity.entityId);
    const entityTypeBuffer = this.serializeString(entity.entityType);
    const positionBuffer = this.serializeVector3(entity.position);
    const velocityBuffer = this.serializeVector3(entity.velocity);
    const rotationBuffer = this.serializeQuaternion(entity.rotation);
    
    return Buffer.concat([
      entityIdBuffer,
      entityTypeBuffer,
      positionBuffer,
      velocityBuffer,
      rotationBuffer
    ]);
  }

  deserializeEntityState(buffer: Buffer, offset: number): { value: any, bytesRead: number } {
    let currentOffset = offset;
    let bytesRead = 0;
    
    const entityIdResult = this.deserializeString(buffer, currentOffset);
    currentOffset += entityIdResult.bytesRead;
    bytesRead += entityIdResult.bytesRead;
    
    const entityTypeResult = this.deserializeString(buffer, currentOffset);
    currentOffset += entityTypeResult.bytesRead;
    bytesRead += entityTypeResult.bytesRead;
    
    const positionResult = this.deserializeVector3(buffer, currentOffset);
    currentOffset += positionResult.bytesRead;
    bytesRead += positionResult.bytesRead;
    
    const velocityResult = this.deserializeVector3(buffer, currentOffset);
    currentOffset += velocityResult.bytesRead;
    bytesRead += velocityResult.bytesRead;
    
    const rotationResult = this.deserializeQuaternion(buffer, currentOffset);
    bytesRead += rotationResult.bytesRead;
    
    return {
      value: {
        entityId: entityIdResult.value,
        entityType: entityTypeResult.value,
        position: positionResult.value,
        velocity: velocityResult.value,
        rotation: rotationResult.value
      },
      bytesRead
    };
  }

  serializeNPCState(npc: any): Buffer {
    const entityIdBuffer = this.serializeString(npc.entityId);
    const npcTypeBuffer = this.serializeString(npc.npcType);
    const statusBuffer = this.serializeString(npc.status);
    const positionBuffer = this.serializeVector3(npc.position);
    const velocityBuffer = this.serializeVector3(npc.velocity);
    const rotationBuffer = this.serializeQuaternion(npc.rotation);
    
    // Target ID (can be undefined)
    const targetIdBuffer = this.serializeString(npc.targetId || '');
    
    // Add a flag to indicate if targetId exists
    const flagBuffer = Buffer.alloc(1);
    flagBuffer.writeUInt8(npc.targetId ? 1 : 0, 0);
    
    return Buffer.concat([
      entityIdBuffer,
      npcTypeBuffer,
      statusBuffer,
      positionBuffer,
      velocityBuffer,
      rotationBuffer,
      flagBuffer,
      targetIdBuffer
    ]);
  }

  deserializeNPCState(buffer: Buffer, offset: number): { value: any, bytesRead: number } {
    let currentOffset = offset;
    let bytesRead = 0;
    
    const entityIdResult = this.deserializeString(buffer, currentOffset);
    currentOffset += entityIdResult.bytesRead;
    bytesRead += entityIdResult.bytesRead;
    
    const npcTypeResult = this.deserializeString(buffer, currentOffset);
    currentOffset += npcTypeResult.bytesRead;
    bytesRead += npcTypeResult.bytesRead;
    
    const statusResult = this.deserializeString(buffer, currentOffset);
    currentOffset += statusResult.bytesRead;
    bytesRead += statusResult.bytesRead;
    
    const positionResult = this.deserializeVector3(buffer, currentOffset);
    currentOffset += positionResult.bytesRead;
    bytesRead += positionResult.bytesRead;
    
    const velocityResult = this.deserializeVector3(buffer, currentOffset);
    currentOffset += velocityResult.bytesRead;
    bytesRead += velocityResult.bytesRead;
    
    const rotationResult = this.deserializeQuaternion(buffer, currentOffset);
    currentOffset += rotationResult.bytesRead;
    bytesRead += rotationResult.bytesRead;
    
    const hasTargetId = buffer.readUInt8(currentOffset) === 1;
    currentOffset += 1;
    bytesRead += 1;
    
    const targetIdResult = this.deserializeString(buffer, currentOffset);
    bytesRead += targetIdResult.bytesRead;
    
    return {
      value: {
        entityId: entityIdResult.value,
        npcType: npcTypeResult.value,
        status: statusResult.value,
        position: positionResult.value,
        velocity: velocityResult.value,
        rotation: rotationResult.value,
        targetId: hasTargetId ? targetIdResult.value : undefined
      },
      bytesRead
    };
  }

  serializeCelestialBodyState(body: any): Buffer {
    // ID (4 bytes) + Other scalar properties
    const buffer = Buffer.alloc(24);
    buffer.writeUInt32LE(body.id, 0);
    buffer.writeFloatLE(body.radius, 4);
    buffer.writeFloatLE(body.mass, 8);
    buffer.writeFloatLE(body.orbitProgress, 12);
    
    // Reserved space (3 floats * 4 bytes = 12 bytes) for future use
    buffer.writeFloatLE(0, 16);
    buffer.writeFloatLE(0, 20);
    
    const nameBuffer = this.serializeString(body.name);
    const typeBuffer = this.serializeString(body.type);
    const colorBuffer = this.serializeString(body.color);
    const positionBuffer = this.serializeVector3(body.position);
    const velocityBuffer = this.serializeVector3(body.velocity);
    
    return Buffer.concat([
      buffer,
      nameBuffer,
      typeBuffer,
      colorBuffer,
      positionBuffer,
      velocityBuffer
    ]);
  }

  deserializeCelestialBodyState(buffer: Buffer, offset: number): { value: any, bytesRead: number } {
    let currentOffset = offset;
    let bytesRead = 0;
    
    const id = buffer.readUInt32LE(currentOffset);
    const radius = buffer.readFloatLE(currentOffset + 4);
    const mass = buffer.readFloatLE(currentOffset + 8);
    const orbitProgress = buffer.readFloatLE(currentOffset + 12);
    currentOffset += 24; // Skip reserved space
    bytesRead += 24;
    
    const nameResult = this.deserializeString(buffer, currentOffset);
    currentOffset += nameResult.bytesRead;
    bytesRead += nameResult.bytesRead;
    
    const typeResult = this.deserializeString(buffer, currentOffset);
    currentOffset += typeResult.bytesRead;
    bytesRead += typeResult.bytesRead;
    
    const colorResult = this.deserializeString(buffer, currentOffset);
    currentOffset += colorResult.bytesRead;
    bytesRead += colorResult.bytesRead;
    
    const positionResult = this.deserializeVector3(buffer, currentOffset);
    currentOffset += positionResult.bytesRead;
    bytesRead += positionResult.bytesRead;
    
    const velocityResult = this.deserializeVector3(buffer, currentOffset);
    bytesRead += velocityResult.bytesRead;
    
    return {
      value: {
        id,
        name: nameResult.value,
        type: typeResult.value,
        position: positionResult.value,
        velocity: velocityResult.value,
        radius,
        mass,
        orbitProgress,
        color: colorResult.value
      },
      bytesRead
    };
  }

  serializeMessage(message: any): Buffer {
    const header = message as MessageHeader;
    const headerBuffer = this.serializeMessageHeader(header);
    
    let bodyBuffer: Buffer;
    
    switch (header.messageType) {
      case MessageType.CLIENT_CONNECT:
        bodyBuffer = Buffer.concat([
          this.serializeString(message.username),
          this.serializeString(message.version)
        ]);
        break;
        
      case MessageType.CLIENT_DISCONNECT:
        bodyBuffer = this.serializeString(message.reason);
        break;
        
      case MessageType.CLIENT_PING:
      case MessageType.SERVER_PONG:
        bodyBuffer = Buffer.alloc(4);
        bodyBuffer.writeUInt32LE(message.pingId, 0);
        break;
        
      case MessageType.CLIENT_STATE_UPDATE:
        bodyBuffer = Buffer.concat([
          this.serializeVector3(message.position),
          this.serializeVector3(message.velocity),
          this.serializeQuaternion(message.rotation),
          Buffer.alloc(4).writeUInt32LE(message.inputSequence, 0) && Buffer.alloc(4)
        ]);
        break;
        
      case MessageType.SERVER_ACCEPT:
        bodyBuffer = Buffer.concat([
          this.serializeString(message.assignedClientId),
          Buffer.alloc(8).writeBigUInt64LE(BigInt(message.serverTime), 0) && Buffer.alloc(8),
          this.serializeVector3(message.initialPosition),
          this.serializeVector3(message.initialVelocity),
          this.serializeQuaternion(message.initialRotation)
        ]);
        break;
        
      case MessageType.SERVER_REJECT:
        bodyBuffer = this.serializeString(message.reason);
        break;
        
      case MessageType.SERVER_STATE_UPDATE:
        const entitiesCountBuffer = Buffer.alloc(2);
        entitiesCountBuffer.writeUInt16LE(message.entities.length, 0);
        
        const entityBuffers = message.entities.map((entity: any) => 
          this.serializeEntityState(entity)
        );
        
        bodyBuffer = Buffer.concat([
          entitiesCountBuffer,
          ...entityBuffers,
          this.serializeString(message.areaOfInterestId),
          Buffer.alloc(8).writeBigUInt64LE(BigInt(message.serverTime), 0) && Buffer.alloc(8)
        ]);
        break;
        
      case MessageType.SERVER_NPC_UPDATE:
        const npcsCountBuffer = Buffer.alloc(2);
        npcsCountBuffer.writeUInt16LE(message.npcs.length, 0);
        
        const npcBuffers = message.npcs.map((npc: any) => 
          this.serializeNPCState(npc)
        );
        
        bodyBuffer = Buffer.concat([
          npcsCountBuffer,
          ...npcBuffers
        ]);
        break;
        
      case MessageType.SERVER_CELESTIAL_UPDATE:
        const bodiesCountBuffer = Buffer.alloc(2);
        bodiesCountBuffer.writeUInt16LE(message.bodies.length, 0);
        
        const bodyBuffers = message.bodies.map((body: any) => 
          this.serializeCelestialBodyState(body)
        );
        
        const simulationTimeBuffer = Buffer.alloc(8);
        simulationTimeBuffer.writeBigUInt64LE(BigInt(message.simulationTime), 0);
        
        bodyBuffer = Buffer.concat([
          bodiesCountBuffer,
          ...bodyBuffers,
          simulationTimeBuffer
        ]);
        break;
        
      case MessageType.SERVER_RELIABLE_ACK:
      case MessageType.CLIENT_RELIABLE_ACK:
        bodyBuffer = Buffer.alloc(4);
        bodyBuffer.writeUInt32LE(message.acknowledgedSequence, 0);
        break;
        
      default:
        bodyBuffer = Buffer.from([]);
    }
    
    return Buffer.concat([headerBuffer, bodyBuffer]);
  }

  deserializeMessage(buffer: Buffer): any {
    const headerResult = this.deserializeMessageHeader(buffer);
    const header = headerResult.value;
    let currentOffset = headerResult.bytesRead;
    
    let body: any = {};
    
    switch (header.messageType) {
      case MessageType.CLIENT_CONNECT:
        const usernameResult = this.deserializeString(buffer, currentOffset);
        currentOffset += usernameResult.bytesRead;
        
        const versionResult = this.deserializeString(buffer, currentOffset);
        
        body = {
          username: usernameResult.value,
          version: versionResult.value
        };
        break;
        
      case MessageType.CLIENT_DISCONNECT:
        const reasonResult = this.deserializeString(buffer, currentOffset);
        body = {
          reason: reasonResult.value
        };
        break;
        
      case MessageType.CLIENT_PING:
      case MessageType.SERVER_PONG:
        body = {
          pingId: buffer.readUInt32LE(currentOffset)
        };
        break;
        
      case MessageType.CLIENT_STATE_UPDATE:
        const positionResult = this.deserializeVector3(buffer, currentOffset);
        currentOffset += positionResult.bytesRead;
        
        const velocityResult = this.deserializeVector3(buffer, currentOffset);
        currentOffset += velocityResult.bytesRead;
        
        const rotationResult = this.deserializeQuaternion(buffer, currentOffset);
        currentOffset += rotationResult.bytesRead;
        
        body = {
          position: positionResult.value,
          velocity: velocityResult.value,
          rotation: rotationResult.value,
          inputSequence: buffer.readUInt32LE(currentOffset)
        };
        break;
        
      case MessageType.SERVER_ACCEPT:
        const assignedClientIdResult = this.deserializeString(buffer, currentOffset);
        currentOffset += assignedClientIdResult.bytesRead;
        
        const serverTime = Number(buffer.readBigUInt64LE(currentOffset));
        currentOffset += 8;
        
        const initialPositionResult = this.deserializeVector3(buffer, currentOffset);
        currentOffset += initialPositionResult.bytesRead;
        
        const initialVelocityResult = this.deserializeVector3(buffer, currentOffset);
        currentOffset += initialVelocityResult.bytesRead;
        
        const initialRotationResult = this.deserializeQuaternion(buffer, currentOffset);
        
        body = {
          assignedClientId: assignedClientIdResult.value,
          serverTime,
          initialPosition: initialPositionResult.value,
          initialVelocity: initialVelocityResult.value,
          initialRotation: initialRotationResult.value
        };
        break;
        
      case MessageType.SERVER_REJECT:
        const rejectReasonResult = this.deserializeString(buffer, currentOffset);
        body = {
          reason: rejectReasonResult.value
        };
        break;
        
      case MessageType.SERVER_STATE_UPDATE:
        const entitiesCount = buffer.readUInt16LE(currentOffset);
        currentOffset += 2;
        
        const entities = [];
        for (let i = 0; i < entitiesCount; i++) {
          const entityResult = this.deserializeEntityState(buffer, currentOffset);
          entities.push(entityResult.value);
          currentOffset += entityResult.bytesRead;
        }
        
        const areaOfInterestIdResult = this.deserializeString(buffer, currentOffset);
        currentOffset += areaOfInterestIdResult.bytesRead;
        
        const stateServerTime = Number(buffer.readBigUInt64LE(currentOffset));
        
        body = {
          entities,
          areaOfInterestId: areaOfInterestIdResult.value,
          serverTime: stateServerTime
        };
        break;
        
      case MessageType.SERVER_NPC_UPDATE:
        const npcsCount = buffer.readUInt16LE(currentOffset);
        currentOffset += 2;
        
        const npcs = [];
        for (let i = 0; i < npcsCount; i++) {
          const npcResult = this.deserializeNPCState(buffer, currentOffset);
          npcs.push(npcResult.value);
          currentOffset += npcResult.bytesRead;
        }
        
        body = {
          npcs
        };
        break;
        
      case MessageType.SERVER_CELESTIAL_UPDATE:
        const bodiesCount = buffer.readUInt16LE(currentOffset);
        currentOffset += 2;
        
        const bodies = [];
        for (let i = 0; i < bodiesCount; i++) {
          const bodyResult = this.deserializeCelestialBodyState(buffer, currentOffset);
          bodies.push(bodyResult.value);
          currentOffset += bodyResult.bytesRead;
        }
        
        const simulationTime = Number(buffer.readBigUInt64LE(currentOffset));
        
        body = {
          bodies,
          simulationTime
        };
        break;
        
      case MessageType.SERVER_RELIABLE_ACK:
      case MessageType.CLIENT_RELIABLE_ACK:
        body = {
          acknowledgedSequence: buffer.readUInt32LE(currentOffset)
        };
        break;
    }
    
    return {
      ...header,
      ...body
    };
  }
}

// Client management information
export interface ClientInfo {
  clientId: string;
  address: string;
  port: number;
  lastActivity: number;
  sequenceIn: number;
  sequenceOut: number;
  reliableMessages: Map<number, { message: Buffer, sendTime: number, attempts: number }>;
  username?: string;
}

export class UDPServer extends EventEmitter {
  private server: dgram.Socket;
  private clients: Map<string, ClientInfo> = new Map();
  private serializer: BinarySerializer;
  private nextSequence: number = 0;
  
  constructor(private port: number) {
    super();
    this.serializer = new BinarySerializerImpl();
    this.server = dgram.createSocket('udp4');
    this.setupServer();
  }
  
  private setupServer(): void {
    this.server.on('error', (err) => {
      console.error(`UDP server error:\n${err.stack}`);
      this.server.close();
      this.emit('error', err);
    });
    
    this.server.on('message', (msg, rinfo) => {
      try {
        const message = this.serializer.deserializeMessage(msg);
        
        // Handle ping messages immediately
        if (message.messageType === MessageType.CLIENT_PING) {
          this.handlePing(message, rinfo);
          return;
        }
        
        // Update client activity time
        const clientId = message.clientId;
        if (clientId && this.clients.has(clientId)) {
          const client = this.clients.get(clientId)!;
          client.lastActivity = Date.now();
          
          // Handle incoming reliable message acknowledgements
          if (message.messageType === MessageType.CLIENT_RELIABLE_ACK) {
            this.handleReliableAck(clientId, message.acknowledgedSequence);
            return;
          }
          
          // Process message normally
          this.emit('message', message, rinfo);
        } else if (message.messageType === MessageType.CLIENT_CONNECT) {
          // New client connection request
          const newClientId = randomUUID();
          this.clients.set(newClientId, {
            clientId: newClientId,
            address: rinfo.address,
            port: rinfo.port,
            lastActivity: Date.now(),
            sequenceIn: 0,
            sequenceOut: 0,
            reliableMessages: new Map(),
            username: message.username
          });
          
          // Emit client connect event with the new ID
          message.assignedClientId = newClientId;
          this.emit('connect', message, rinfo);
        } else {
          // Unknown client, reject
          console.warn(`Received message from unknown client: ${rinfo.address}:${rinfo.port}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    this.server.on('listening', () => {
      const address = this.server.address();
      console.log(`UDP server listening on ${address.address}:${address.port}`);
      this.emit('listening', address);
    });
    
    // Start the server
    this.server.bind(this.port, '0.0.0.0');
    
    // Start cleanup timer
    setInterval(() => this.cleanupInactiveClients(), 10000);
    
    // Start reliable message resend timer
    setInterval(() => this.resendReliableMessages(), 1000);
  }
  
  private cleanupInactiveClients(): void {
    const now = Date.now();
    const timeoutThreshold = 30000; // 30 seconds
    
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > timeoutThreshold) {
        console.log(`Client ${clientId} timed out`);
        this.emit('disconnect', { clientId, reason: 'timeout' });
        this.clients.delete(clientId);
      }
    }
  }
  
  private resendReliableMessages(): void {
    const now = Date.now();
    const resendInterval = 1000; // 1 second
    const maxAttempts = 5;
    
    for (const [clientId, client] of this.clients.entries()) {
      for (const [sequence, data] of client.reliableMessages.entries()) {
        if (now - data.sendTime > resendInterval) {
          if (data.attempts >= maxAttempts) {
            // Too many attempts, consider client disconnected
            console.log(`Client ${clientId} failed to acknowledge message after ${maxAttempts} attempts`);
            this.emit('disconnect', { clientId, reason: 'failed_ack' });
            this.clients.delete(clientId);
            break;
          }
          
          // Resend the message
          console.log(`Resending message ${sequence} to client ${clientId}`);
          this.server.send(
            data.message,
            0,
            data.message.length,
            client.port,
            client.address
          );
          
          // Update send time and attempts
          data.sendTime = now;
          data.attempts++;
        }
      }
    }
  }
  
  private handlePing(message: any, rinfo: dgram.RemoteInfo): void {
    // Respond immediately with a pong
    const pong = {
      messageType: MessageType.SERVER_PONG,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      clientId: message.clientId,
      pingId: message.pingId
    };
    
    const buffer = this.serializer.serializeMessage(pong);
    this.server.send(buffer, 0, buffer.length, rinfo.port, rinfo.address);
  }
  
  private handleReliableAck(clientId: string, acknowledgedSequence: number): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove acknowledged message from pending list
      client.reliableMessages.delete(acknowledgedSequence);
    }
  }
  
  private getNextSequence(): number {
    const sequence = this.nextSequence;
    this.nextSequence = (this.nextSequence + 1) % 0xFFFFFFFF;
    return sequence;
  }
  
  sendToClient(clientId: string, message: any, reliable: boolean = false): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    
    // Set sequence number
    message.sequence = this.getNextSequence();
    message.timestamp = Date.now();
    
    // Serialize message
    const buffer = this.serializer.serializeMessage(message);
    
    // Send message
    this.server.send(
      buffer,
      0,
      buffer.length,
      client.port,
      client.address
    );
    
    // For reliable messages, store for potential resend
    if (reliable) {
      client.reliableMessages.set(message.sequence, {
        message: buffer,
        sendTime: Date.now(),
        attempts: 1
      });
    }
    
    return true;
  }
  
  sendToAll(message: any, reliable: boolean = false): void {
    for (const [clientId] of this.clients.entries()) {
      this.sendToClient(clientId, { ...message }, reliable);
    }
  }
  
  sendToAllExcept(excludeClientId: string, message: any, reliable: boolean = false): void {
    for (const [clientId] of this.clients.entries()) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, { ...message }, reliable);
      }
    }
  }
  
  disconnectClient(clientId: string, reason: string = 'server_disconnect'): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    
    // Send disconnect message to client
    const message = {
      messageType: MessageType.SERVER_REJECT,
      sequence: this.getNextSequence(),
      timestamp: Date.now(),
      clientId,
      reason
    };
    
    const buffer = this.serializer.serializeMessage(message);
    this.server.send(
      buffer,
      0,
      buffer.length,
      client.port,
      client.address
    );
    
    // Remove client from list
    this.clients.delete(clientId);
    
    // Emit disconnect event
    this.emit('disconnect', { clientId, reason });
    
    return true;
  }
  
  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
  
  getClientInfo(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId);
  }
  
  getSerializer(): BinarySerializer {
    return this.serializer;
  }
  
  close(): void {
    this.server.close();
  }
}
