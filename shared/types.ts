import { Vector3, Quaternion } from './math';

// UDP Message Types
export enum MessageType {
  CLIENT_CONNECT = 0,
  CLIENT_DISCONNECT = 1,
  CLIENT_PING = 2,
  CLIENT_PONG = 3,
  CLIENT_STATE_UPDATE = 4,
  SERVER_ACCEPT = 5,
  SERVER_REJECT = 6,
  SERVER_STATE_UPDATE = 7,
  SERVER_PHYSICS_UPDATE = 8,
  SERVER_NPC_UPDATE = 9,
  SERVER_AREA_OF_INTEREST_UPDATE = 10,
  SERVER_CELESTIAL_UPDATE = 11,
  SERVER_SANITY_CHECK = 12,
  SERVER_RELIABLE_ACK = 13,
  CLIENT_RELIABLE_ACK = 14,
}

// Message header structure shared by all message types
export interface MessageHeader {
  messageType: MessageType;
  sequence: number;  // Sequence number for reliable ordering
  timestamp: number; // Timestamp in milliseconds
  clientId: string;  // Unique identifier for the client
}

// Client connection request
export interface ClientConnectMessage extends MessageHeader {
  username: string;
  version: string;
}

// Client disconnect notification
export interface ClientDisconnectMessage extends MessageHeader {
  reason: string;
}

// Client ping message for latency measurement
export interface ClientPingMessage extends MessageHeader {
  pingId: number;
}

// Server pong response
export interface ServerPongMessage extends MessageHeader {
  pingId: number;
}

// Client state update (position, rotation, etc.)
export interface ClientStateUpdateMessage extends MessageHeader {
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  inputSequence: number;
}

// Server accept connection
export interface ServerAcceptMessage extends MessageHeader {
  assignedClientId: string;
  serverTime: number;
  initialPosition: Vector3;
  initialVelocity: Vector3;
  initialRotation: Quaternion;
}

// Server reject connection
export interface ServerRejectMessage extends MessageHeader {
  reason: string;
}

// Entity basic info for state updates
export interface EntityState {
  entityId: string;
  entityType: 'player' | 'npc';
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
}

// Server state update (other entities in area of interest)
export interface ServerStateUpdateMessage extends MessageHeader {
  entities: EntityState[];
  areaOfInterestId: string;
  serverTime: number;
}

// Physics properties for physics update
export interface PhysicsState {
  gravity: Vector3;
  timeScale: number;
}

// Server physics update (environmental factors)
export interface ServerPhysicsUpdateMessage extends MessageHeader {
  physics: PhysicsState;
  nearestCelestialBodyId: number;
  distanceToCelestialBody: number;
}

// NPC definition for NPC updates
export interface NPCState {
  entityId: string;
  npcType: 'enemy' | 'transport' | 'civilian' | 'mining';
  status: 'hostile' | 'en-route' | 'passive' | 'working';
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  targetId?: string;
}

// Server NPC update
export interface ServerNPCUpdateMessage extends MessageHeader {
  npcs: NPCState[];
}

// Area of interest definition
export interface AreaOfInterestState {
  id: string;
  name: string;
  center: Vector3;
  radius: number;
  playerCount: number;
  npcCount: number;
  load: number;
  latency: number;
}

// Server area of interest update
export interface ServerAreaOfInterestUpdateMessage extends MessageHeader {
  areas: AreaOfInterestState[];
  currentAreaId: string;
}

// Celestial body definition for celestial updates
export interface CelestialBodyState {
  id: number;
  name: string;
  type: string;
  position: Vector3;
  velocity: Vector3;
  radius: number;
  mass: number;
  orbitProgress: number; // 0-1 representing percentage of orbit completed
  color: string;
}

// Server celestial body update
export interface ServerCelestialUpdateMessage extends MessageHeader {
  bodies: CelestialBodyState[];
  simulationTime: number;
}

// Server sanity check request/response
export interface ServerSanityCheckMessage extends MessageHeader {
  checkId: number;
  checkType: 'position' | 'velocity' | 'acceleration' | 'collision';
  expectedValue?: any;
  tolerance?: number;
}

// Reliable delivery acknowledgement
export interface ReliableAckMessage extends MessageHeader {
  acknowledgedSequence: number;
}

// Binary serialization functions
export interface BinarySerializer {
  serializeVector3(v: Vector3): Buffer;
  deserializeVector3(buffer: Buffer, offset: number): { value: Vector3, bytesRead: number };
  
  serializeQuaternion(q: Quaternion): Buffer;
  deserializeQuaternion(buffer: Buffer, offset: number): { value: Quaternion, bytesRead: number };
  
  serializeString(str: string): Buffer;
  deserializeString(buffer: Buffer, offset: number): { value: string, bytesRead: number };
  
  serializeMessageHeader(header: MessageHeader): Buffer;
  deserializeMessageHeader(buffer: Buffer, offset: number): { value: MessageHeader, bytesRead: number };
  
  serializeEntityState(entity: EntityState): Buffer;
  deserializeEntityState(buffer: Buffer, offset: number): { value: EntityState, bytesRead: number };
  
  serializeNPCState(npc: NPCState): Buffer;
  deserializeNPCState(buffer: Buffer, offset: number): { value: NPCState, bytesRead: number };
  
  serializeCelestialBodyState(body: CelestialBodyState): Buffer;
  deserializeCelestialBodyState(buffer: Buffer, offset: number): { value: CelestialBodyState, bytesRead: number };
  
  serializeMessage(message: any): Buffer;
  deserializeMessage(buffer: Buffer): any;
}

// Mission system types
export enum MissionType {
  COMBAT = 'combat',
  TRADE = 'trade', 
  MINING = 'mining',
  ESCORT = 'escort',
  EXPLORATION = 'exploration',
  DELIVERY = 'delivery',
  RESCUE = 'rescue',
  PATROL = 'patrol'
}

export enum MissionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned'
}

export interface MissionState {
  missionId: string;
  name: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  reward: number;
  difficulty: number;
  startLocationId: number;
  endLocationId: number; 
  assignedFleetId?: string;
  progressValue: number;
  progressTarget: number;
  startTime: number;
  expiryTime: number;
  completeTime?: number;
}

export interface ServerMissionUpdateMessage extends MessageHeader {
  missions: MissionState[];
}

// Server settings interface
export interface ServerSettings {
  maxPlayers: number;
  tickRate: number;
  simulationSpeed: number;
  aoiRadius: number;
  aoiMaxEntities: number;
  sanityCheckFrequency: number;
  reliableResendInterval: number;
  maxReliableResends: number;
  disconnectTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
