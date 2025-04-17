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
  private simulatedPlayers: Map<string, Player> = new Map();
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
  
  // Create simulated players for testing
  createSimulatedPlayers(count: number, areaId?: string): Player[] {
    const simulatedPlayers: Player[] = [];
    const positionRadius = 5000; // Spread players in a 5000 unit radius
    const celestialBodies = []; // Would need to fetch this
    
    for (let i = 0; i < count; i++) {
      // Generate a random position within the radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * positionRadius;
      const posX = Math.cos(angle) * distance;
      const posY = Math.sin(angle) * distance;
      const posZ = (Math.random() - 0.5) * 1000; // Some vertical spread
      
      // Generate a random velocity
      const velMagnitude = 50 + Math.random() * 200;
      const velAngle = Math.random() * Math.PI * 2;
      const velX = Math.cos(velAngle) * velMagnitude;
      const velY = Math.sin(velAngle) * velMagnitude;
      const velZ = (Math.random() - 0.5) * 20;
      
      // Generate a random rotation (as a quaternion)
      const rotX = Math.random() - 0.5;
      const rotY = Math.random() - 0.5;
      const rotZ = Math.random() - 0.5;
      const rotW = Math.random() - 0.5;
      
      // Normalize the quaternion
      const length = Math.sqrt(rotX*rotX + rotY*rotY + rotZ*rotZ + rotW*rotW);
      const normRotX = rotX / length;
      const normRotY = rotY / length;
      const normRotZ = rotZ / length;
      const normRotW = rotW / length;
      
      const now = Date.now();
      const playerId = `sim-${i}-${now}`;
      
      // Create the simulated player
      const player: Player = {
        id: i,
        clientId: playerId,
        username: `SimPlayer${i}`,
        shipType: Math.random() > 0.5 ? 'fighter' : 'cruiser',
        positionX: posX,
        positionY: posY,
        positionZ: posZ,
        velocityX: velX,
        velocityY: velY,
        velocityZ: velZ,
        rotationX: normRotX,
        rotationY: normRotY,
        rotationZ: normRotZ,
        rotationW: normRotW,
        health: 100,
        energy: 100,
        shield: 100,
        connected: true,
        lastUpdate: now,
        createdAt: now
      };
      
      // Add to tracking maps
      this.simulatedPlayers.set(playerId, player);
      simulatedPlayers.push(player);
      
      // Register in AOI system
      const position = new Vector3(posX, posY, posZ);
      const assignedAreaId = this.aoiManager.registerEntity(playerId, position, 'player');
      
      console.log(`Simulated player ${playerId} created in area ${assignedAreaId || 'none'}`);
    }
    
    return simulatedPlayers;
  }
  
  // Update simulated players to behave like real players
  updateSimulatedPlayers(deltaTime: number): void {
    // Get all celestial bodies as potential targets
    const celestialBodies = Array.from(this.npcManager.celestialBodies.values());
    
    for (const [playerId, player] of this.simulatedPlayers.entries()) {
      // Update position based on velocity
      player.positionX += player.velocityX * deltaTime;
      player.positionY += player.velocityY * deltaTime;
      player.positionZ += player.velocityZ * deltaTime;
      
      // Determine player behavior based on a pseudo AI state machine
      const playerState = player.aiState || 'exploring';
      const targetBody = player.targetBodyId ? 
        this.npcManager.celestialBodies.get(player.targetBodyId) : null;
      
      // Occasionally change behavior (state transitions)
      if (Math.random() < 0.01) { // 1% chance per update
        // Choose a new behavior
        const states = ['exploring', 'orbiting', 'traveling', 'mining', 'combat'];
        const weights = [0.3, 0.3, 0.2, 0.1, 0.1]; // Probability weights
        
        // Weighted random selection of a state
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let randomValue = Math.random() * totalWeight;
        let selectedIndex = 0;
        
        for (let i = 0; i < weights.length; i++) {
          randomValue -= weights[i];
          if (randomValue <= 0) {
            selectedIndex = i;
            break;
          }
        }
        
        player.aiState = states[selectedIndex];
        
        // If transitioning to orbiting or traveling, choose a random celestial body
        if (['orbiting', 'traveling', 'mining'].includes(player.aiState) && celestialBodies.length > 0) {
          const randomBodyIndex = Math.floor(Math.random() * celestialBodies.length);
          player.targetBodyId = celestialBodies[randomBodyIndex].id;
        }
      }
      
      // Execute behavior based on current state
      switch (playerState) {
        case 'exploring':
          // Random gentle movements
          if (Math.random() < 0.1) {
            const changeAmount = 10;
            player.velocityX += (Math.random() - 0.5) * changeAmount;
            player.velocityY += (Math.random() - 0.5) * changeAmount;
            player.velocityZ += (Math.random() - 0.5) * changeAmount;
            
            // Apply drag to keep speed reasonable
            const dragFactor = 0.98;
            player.velocityX *= dragFactor;
            player.velocityY *= dragFactor;
            player.velocityZ *= dragFactor;
          }
          break;
          
        case 'orbiting':
          if (targetBody) {
            // Calculate vector to celestial body
            const dx = targetBody.currentPositionX - player.positionX;
            const dy = targetBody.currentPositionY - player.positionY;
            const dz = targetBody.currentPositionZ - player.positionZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Orbital parameters
            const orbitRadius = targetBody.radius * 2; // Orbit at twice the body's radius
            
            if (distance > orbitRadius * 1.2) {
              // Too far - move toward the body
              const moveSpeed = 200;
              player.velocityX = (dx / distance) * moveSpeed;
              player.velocityY = (dy / distance) * moveSpeed;
              player.velocityZ = (dz / distance) * moveSpeed;
            }
            else if (distance < orbitRadius * 0.8) {
              // Too close - move away from the body
              const moveSpeed = 150;
              player.velocityX = -(dx / distance) * moveSpeed;
              player.velocityY = -(dy / distance) * moveSpeed;
              player.velocityZ = -(dz / distance) * moveSpeed;
            }
            else {
              // In orbital range - circle the body
              // Cross product for perpendicular direction
              const orbitalSpeed = 100 + Math.random() * 50;
              
              // If we're not already moving fast enough, adjust velocity
              const currentSpeed = Math.sqrt(
                player.velocityX * player.velocityX +
                player.velocityY * player.velocityY +
                player.velocityZ * player.velocityZ
              );
              
              if (currentSpeed < orbitalSpeed * 0.8) {
                // Create orbital velocity (cross product with up vector for simplicity)
                player.velocityX = -dy * orbitalSpeed / distance;
                player.velocityY = dx * orbitalSpeed / distance;
                player.velocityZ = player.velocityZ * 0.95; // Reduce vertical velocity
              }
            }
          }
          break;
          
        case 'traveling':
          if (targetBody) {
            // Calculate vector to celestial body
            const dx = targetBody.currentPositionX - player.positionX;
            const dy = targetBody.currentPositionY - player.positionY;
            const dz = targetBody.currentPositionZ - player.positionZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Direct travel toward target
            const travelSpeed = 400 + Math.random() * 200;
            player.velocityX = (dx / distance) * travelSpeed;
            player.velocityY = (dy / distance) * travelSpeed;
            player.velocityZ = (dz / distance) * travelSpeed;
            
            // If we're close enough, transition to orbiting
            if (distance < targetBody.radius * 5) {
              player.aiState = 'orbiting';
            }
          }
          break;
          
        case 'mining':
          if (targetBody && targetBody.type === 'asteroid') {
            // Similar to orbiting but stay closer
            const dx = targetBody.currentPositionX - player.positionX;
            const dy = targetBody.currentPositionY - player.positionY;
            const dz = targetBody.currentPositionZ - player.positionZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            const miningDistance = targetBody.radius * 1.2;
            
            if (distance > miningDistance * 1.2) {
              // Move closer
              const moveSpeed = 100;
              player.velocityX = (dx / distance) * moveSpeed;
              player.velocityY = (dy / distance) * moveSpeed;
              player.velocityZ = (dz / distance) * moveSpeed;
            }
            else {
              // Hold position with minor adjustments
              player.velocityX *= 0.9;
              player.velocityY *= 0.9;
              player.velocityZ *= 0.9;
              
              // Add small random adjustments to simulate mining activity
              player.velocityX += (Math.random() - 0.5) * 5;
              player.velocityY += (Math.random() - 0.5) * 5;
              player.velocityZ += (Math.random() - 0.5) * 5;
            }
          }
          break;
          
        case 'combat':
          // Find a nearby player or NPC to engage
          const nearbyPlayers = Array.from(this.playerStates.values())
            .filter(otherPlayer => otherPlayer.clientId !== player.clientId);
            
          if (nearbyPlayers.length > 0) {
            // Choose a random player to engage
            const targetIndex = Math.floor(Math.random() * nearbyPlayers.length);
            const targetPlayer = nearbyPlayers[targetIndex];
            
            // Move toward the target
            const dx = targetPlayer.positionX - player.positionX;
            const dy = targetPlayer.positionY - player.positionY;
            const dz = targetPlayer.positionZ - player.positionZ;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Engage at medium range
            const combatSpeed = 250 + Math.random() * 100;
            player.velocityX = (dx / distance) * combatSpeed;
            player.velocityY = (dy / distance) * combatSpeed;
            player.velocityZ = (dz / distance) * combatSpeed;
            
            // Add some evasive maneuvers
            player.velocityX += (Math.random() - 0.5) * 50;
            player.velocityY += (Math.random() - 0.5) * 50;
            player.velocityZ += (Math.random() - 0.5) * 30;
          }
          else {
            // No targets, revert to exploring
            player.aiState = 'exploring';
          }
          break;
      }
      
      // Update rotation to face the direction of travel
      if (Math.abs(player.velocityX) > 0.1 || Math.abs(player.velocityY) > 0.1) {
        // Calculate the heading angle based on velocity
        const heading = Math.atan2(player.velocityY, player.velocityX);
        
        // Convert heading to quaternion (simplified - just rotating around Z axis)
        player.rotationX = 0;
        player.rotationY = 0;
        player.rotationZ = Math.sin(heading / 2);
        player.rotationW = Math.cos(heading / 2);
      }
      
      // Apply velocity limits
      const maxSpeed = 1000;
      const currentSpeed = Math.sqrt(
        player.velocityX * player.velocityX +
        player.velocityY * player.velocityY +
        player.velocityZ * player.velocityZ
      );
      
      if (currentSpeed > maxSpeed) {
        const reduction = maxSpeed / currentSpeed;
        player.velocityX *= reduction;
        player.velocityY *= reduction;
        player.velocityZ *= reduction;
      }
      
      // Boundary check to keep players within a reasonable area
      const boundaryRadius = 2000000; // Scaled up to match celestial bodies
      const distanceFromCenter = Math.sqrt(
        player.positionX * player.positionX + 
        player.positionY * player.positionY + 
        player.positionZ * player.positionZ
      );
      
      if (distanceFromCenter > boundaryRadius) {
        // If out of bounds, reverse direction and head back inward
        player.velocityX = -player.velocityX * 0.5;
        player.velocityY = -player.velocityY * 0.5;
        player.velocityZ = -player.velocityZ * 0.5;
        player.aiState = 'traveling';
        
        // Pick a central body to target
        if (celestialBodies.length > 0) {
          // Find the Sun or central body
          const centralBody = celestialBodies.find(body => body.name === 'Sun') || celestialBodies[0];
          player.targetBodyId = centralBody.id;
        }
      }
      
      // Update in AOI system
      const position = new Vector3(player.positionX, player.positionY, player.positionZ);
      this.aoiManager.updateEntityPosition(playerId, position, 'player');
    }
  }
  
  // Remove all simulated players
  removeAllSimulatedPlayers(): void {
    for (const [playerId, player] of this.simulatedPlayers.entries()) {
      // Remove from AOI system
      this.aoiManager.removeEntity(playerId, 'player');
    }
    
    const removedCount = this.simulatedPlayers.size;
    this.simulatedPlayers.clear();
    console.log(`Removed ${removedCount} simulated players`);
  }
  
  // Get all players (both real and simulated)
  getAllPlayers(): Player[] {
    const realPlayers = Array.from(this.playerStates.values());
    const simPlayers = Array.from(this.simulatedPlayers.values());
    return [...realPlayers, ...simPlayers];
  }
  
  // Get player count (both real and simulated)
  getPlayerCount(): number {
    return this.playerStates.size + this.simulatedPlayers.size;
  }
  
  // Get only real players
  getRealPlayers(): Player[] {
    return Array.from(this.playerStates.values());
  }
  
  // Get only simulated players
  getSimulatedPlayers(): Player[] {
    return Array.from(this.simulatedPlayers.values());
  }
  
  // Get count of simulated players
  getSimulatedPlayerCount(): number {
    return this.simulatedPlayers.size;
  }
}
