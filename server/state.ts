import { Vector3, Quaternion } from '@shared/math';
import { MessageType, EntityState, NPCState, ServerStateUpdateMessage } from '@shared/types';
import { UDPServer } from './udp';
import { AOIManager, AOIEntity } from './aoi';
import { Player } from '@shared/schema';
import { NPCManager } from './npc';
import { storage } from './storage';

// Game state manager
export class GameStateManager {
  private udpServer: UDPServer;
  private aoiManager: AOIManager;
  private npcManager: NPCManager;
  
  // Maps to track entity state
  private playerStates: Map<string, Player> = new Map();
  private lastUpdateTime: number = Date.now();
  
  constructor(udpServer: UDPServer, aoiManager: AOIManager, npcManager: NPCManager) {
    this.udpServer = udpServer;
    this.aoiManager = aoiManager;
    this.npcManager = npcManager;
  }
  
  // Initialize the game state
  async initialize(): Promise<void> {
    try {
      // Load all connected players from storage
      const players = await storage.getConnectedPlayers();
      
      for (const player of players) {
        this.playerStates.set(player.clientId, player);
        
        // Register player in AOI system
        const position = new Vector3(player.positionX, player.positionY, player.positionZ);
        this.aoiManager.registerEntity(player.clientId, position, 'player');
      }
      
      console.log(`Initialized game state with ${players.length} active players`);
    } catch (error) {
      console.error('Failed to initialize game state:', error);
    }
  }
  
  // Register a new player
  registerPlayer(player: Player): void {
    this.playerStates.set(player.clientId, player);
    
    // Register in AOI system
    const position = new Vector3(player.positionX, player.positionY, player.positionZ);
    const areaId = this.aoiManager.registerEntity(player.clientId, position, 'player');
    
    console.log(`Player ${player.clientId} registered in area ${areaId || 'none'}`);
  }
  
  // Update a player's state
  updatePlayerState(
    clientId: string,
    position: Vector3,
    velocity: Vector3,
    rotation: Quaternion
  ): void {
    const player = this.playerStates.get(clientId);
    
    if (player) {
      // Update player state in memory
      player.positionX = position.x;
      player.positionY = position.y;
      player.positionZ = position.z;
      player.velocityX = velocity.x;
      player.velocityY = velocity.y;
      player.velocityZ = velocity.z;
      player.rotationX = rotation.x;
      player.rotationY = rotation.y;
      player.rotationZ = rotation.z;
      player.rotationW = rotation.w;
      player.lastUpdate = Date.now();
      
      // Update area of interest if needed
      this.aoiManager.updateEntityPosition(clientId, position, 'player');
      
      // Persist state to storage asynchronously (but don't wait for it)
      storage.updatePlayer(player.id, {
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        velocityX: velocity.x,
        velocityY: velocity.y,
        velocityZ: velocity.z,
        rotationX: rotation.x,
        rotationY: rotation.y,
        rotationZ: rotation.z,
        rotationW: rotation.w,
        lastUpdate: player.lastUpdate,
      }).catch(err => {
        console.error(`Failed to persist player state for ${clientId}:`, err);
      });
    }
  }
  
  // Remove a player
  removePlayer(clientId: string): void {
    // Remove from AOI system
    this.aoiManager.removeEntity(clientId, 'player');
    
    // Remove from state map
    this.playerStates.delete(clientId);
    
    console.log(`Player ${clientId} removed from game state`);
  }
  
  // Get all entities (players and NPCs) as generic entities for AOI
  private getAllEntities(): AOIEntity[] {
    const entities: AOIEntity[] = [];
    
    // Add players
    for (const [clientId, player] of this.playerStates.entries()) {
      entities.push({
        id: clientId,
        position: new Vector3(player.positionX, player.positionY, player.positionZ),
        type: 'player'
      });
    }
    
    // Add NPCs
    for (const npc of this.npcManager.getAllNPCs()) {
      const npcId = `npc-${npc.id}`;
      entities.push({
        id: npcId,
        position: new Vector3(npc.positionX, npc.positionY, npc.positionZ),
        type: 'npc'
      });
    }
    
    return entities;
  }
  
  // Convert a player to an entity state
  private playerToEntityState(player: Player): EntityState {
    return {
      entityId: player.clientId,
      entityType: 'player',
      position: new Vector3(player.positionX, player.positionY, player.positionZ),
      velocity: new Vector3(player.velocityX, player.velocityY, player.velocityZ),
      rotation: new Quaternion(player.rotationX, player.rotationY, player.rotationZ, player.rotationW)
    };
  }
  
  // Send state updates to all players
  sendStateUpdates(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;
    
    // Update NPC positions and behaviors
    this.npcManager.update(deltaTime, now / 1000);
    
    // Get all entities for AOI checks
    const allEntities = this.getAllEntities();
    
    // Send updates to each player
    for (const [clientId, player] of this.playerStates.entries()) {
      // Get relevant entities for this player
      const relevantEntities = this.aoiManager.getRelevantEntities(clientId, allEntities);
      
      // Create entity states for each relevant entity
      const entityStates: EntityState[] = [];
      
      for (const entity of relevantEntities) {
        // Skip the player itself (client already knows its own state)
        if (entity.id === clientId) continue;
        
        if (entity.type === 'player') {
          const otherPlayer = this.playerStates.get(entity.id);
          if (otherPlayer) {
            entityStates.push(this.playerToEntityState(otherPlayer));
          }
        } else if (entity.type === 'npc') {
          // NPCs have a prefix "npc-" in their ID
          const npcId = parseInt(entity.id.replace('npc-', ''), 10);
          const npc = this.npcManager.getAllNPCs().find(n => n.id === npcId);
          
          if (npc) {
            const npcState = this.npcManager.npcToState(npc);
            entityStates.push({
              entityId: npcState.entityId,
              entityType: 'npc',
              position: npcState.position,
              velocity: npcState.velocity,
              rotation: npcState.rotation
            });
          }
        }
      }
      
      // Get the player's area
      const playerArea = this.aoiManager.getEntityArea(clientId);
      
      // Prepare and send state update message
      if (playerArea) {
        const message: ServerStateUpdateMessage = {
          messageType: MessageType.SERVER_STATE_UPDATE,
          sequence: 0, // Will be set by UDP server
          timestamp: now,
          clientId,
          entities: entityStates,
          areaOfInterestId: playerArea.id,
          serverTime: now
        };
        
        this.udpServer.sendToClient(clientId, message);
      }
    }
  }
  
  // Send NPC updates to players
  sendNPCUpdates(): void {
    // For each player's area of interest, find relevant NPCs
    for (const [clientId, player] of this.playerStates.entries()) {
      const playerArea = this.aoiManager.getEntityArea(clientId);
      
      if (!playerArea) continue;
      
      // Get all NPCs in or near this area
      const playerPos = new Vector3(player.positionX, player.positionY, player.positionZ);
      const npcsInArea = this.npcManager.getNPCsNearPosition(playerPos, playerArea.radius);
      
      // Convert to NPC states
      const npcStates: NPCState[] = npcsInArea.map(npc => this.npcManager.npcToState(npc));
      
      // Send NPC update if there are any NPCs to report
      if (npcStates.length > 0) {
        const message = {
          messageType: MessageType.SERVER_NPC_UPDATE,
          sequence: 0, // Will be set by UDP server
          timestamp: Date.now(),
          clientId,
          npcs: npcStates
        };
        
        this.udpServer.sendToClient(clientId, message);
      }
    }
  }
  
  // Send area of interest updates to a player
  sendAreaOfInterestUpdate(clientId: string): void {
    const currentArea = this.aoiManager.getEntityArea(clientId);
    
    if (currentArea) {
      const message = {
        messageType: MessageType.SERVER_AREA_OF_INTEREST_UPDATE,
        sequence: 0, // Will be set by UDP server
        timestamp: Date.now(),
        clientId,
        areas: this.aoiManager.getAllAreaStates(),
        currentAreaId: currentArea.id
      };
      
      this.udpServer.sendToClient(clientId, message);
    }
  }
  
  // Get all players
  getAllPlayers(): Player[] {
    return Array.from(this.playerStates.values());
  }
  
  // Get player count
  getPlayerCount(): number {
    return this.playerStates.size;
  }
}
