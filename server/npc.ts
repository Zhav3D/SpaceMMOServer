import { Vector3, Quaternion } from '@shared/math';
import { CelestialBody, NpcShip, NpcFleet } from '@shared/schema';
import { NPCState } from '@shared/types';
import { updateCelestialBodyPosition } from '@shared/physics';

// NPC AI states
export enum NPCAIState {
  IDLE = 'idle',
  PATROLLING = 'patrolling',
  ATTACKING = 'attacking',
  FLEEING = 'fleeing',
  MINING = 'mining',
  DOCKING = 'docking',
  TRADING = 'trading',
  ESCORTING = 'escorting',
}

// NPC ship types
export type NPCShipType = 'enemy' | 'transport' | 'civilian' | 'mining';

// NPC ship status
export type NPCShipStatus = 'hostile' | 'en-route' | 'passive' | 'working';

// NPC ship parameters
interface NPCParameters {
  maxSpeed: number;
  turnRate: number;
  maxAcceleration: number;
  detectionRange: number;
  attackRange: number;
  fleeThreshold: number; // Health percentage to flee
}

// NPC ship parameters by type
const NPC_PARAMETERS: Record<NPCShipType, NPCParameters> = {
  enemy: {
    maxSpeed: 50.0,
    turnRate: 0.1,
    maxAcceleration: 10.0,
    detectionRange: 1000.0,
    attackRange: 300.0,
    fleeThreshold: 0.3,
  },
  transport: {
    maxSpeed: 30.0,
    turnRate: 0.05,
    maxAcceleration: 5.0,
    detectionRange: 800.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.5,
  },
  civilian: {
    maxSpeed: 20.0,
    turnRate: 0.08,
    maxAcceleration: 4.0,
    detectionRange: 600.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.7,
  },
  mining: {
    maxSpeed: 15.0,
    turnRate: 0.03,
    maxAcceleration: 3.0,
    detectionRange: 500.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.4,
  },
};

// Utility function to create a basic NPC of a given type
export function createNPC(
  type: NPCShipType,
  position: Vector3,
  nearestCelestialBodyId: number,
  fleetId: string,
): NpcShip {
  // Generate a random velocity
  const velocityDirection = new Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize();
  
  const speed = NPC_PARAMETERS[type].maxSpeed * 0.3; // Start at 30% of max speed
  const velocity = velocityDirection.multiply(speed);
  
  // Generate random rotation
  const rotationX = Math.random() * 2 - 1;
  const rotationY = Math.random() * 2 - 1;
  const rotationZ = Math.random() * 2 - 1;
  const rotationW = Math.random() * 2 - 1;
  const rotationMag = Math.sqrt(rotationX ** 2 + rotationY ** 2 + rotationZ ** 2 + rotationW ** 2);
  
  // Determine initial status for this NPC type
  let status: NPCShipStatus = 'passive';
  let aiState = NPCAIState.IDLE;
  
  switch (type) {
    case 'enemy':
      status = 'hostile';
      aiState = NPCAIState.PATROLLING;
      break;
    case 'transport':
      status = 'en-route';
      aiState = NPCAIState.PATROLLING;
      break;
    case 'mining':
      status = 'working';
      aiState = NPCAIState.MINING;
      break;
    case 'civilian':
    default:
      status = 'passive';
      aiState = NPCAIState.PATROLLING;
      break;
  }
  
  // Create ship with no ID (will be set by database)
  const ship: Omit<NpcShip, "id"> & { id: number } = {
    id: 0,
    type,
    status,
    positionX: position.x,
    positionY: position.y,
    positionZ: position.z,
    velocityX: velocity.x,
    velocityY: velocity.y,
    velocityZ: velocity.z,
    rotationX: rotationX / rotationMag,
    rotationY: rotationY / rotationMag,
    rotationZ: rotationZ / rotationMag,
    rotationW: rotationW / rotationMag,
    nearestCelestialBodyId,
    fleetId,
    aiState,
    targetId: null,
  };
  
  return ship;
}

// Utility function to create a fleet of NPCs
export function createNPCFleet(
  type: NPCShipType,
  count: number,
  location: string,
  nearestCelestialBodyId: number,
): { fleet: NpcFleet, ships: NpcShip[] } {
  const fleetId = `fleet-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Determine status based on type
  let status: NPCShipStatus = 'passive';
  switch (type) {
    case 'enemy':
      status = 'hostile';
      break;
    case 'transport':
      status = 'en-route';
      break;
    case 'mining':
      status = 'working';
      break;
    case 'civilian':
    default:
      status = 'passive';
      break;
  }
  
  const fleet: NpcFleet = {
    id: 0, // Will be set by database
    fleetId,
    type,
    status,
    count,
    location,
    nearestCelestialBodyId,
  };
  
  // Create ships
  const ships: NpcShip[] = [];
  
  // Get celestial body position to use as reference
  const centerPosition = new Vector3(0, 0, 0); // Default if no body info
  
  // Create ships in a formation around the center
  const formationRadius = 300.0; // Adjust based on fleet size
  const formationHeight = 100.0;
  
  for (let i = 0; i < count; i++) {
    // Position ships in a circular formation with some randomness
    const angle = (i / count) * Math.PI * 2;
    const distanceFromCenter = formationRadius * (0.8 + Math.random() * 0.4);
    const offsetX = Math.cos(angle) * distanceFromCenter;
    const offsetY = Math.sin(angle) * distanceFromCenter;
    const offsetZ = (Math.random() - 0.5) * formationHeight;
    
    const position = new Vector3(
      centerPosition.x + offsetX,
      centerPosition.y + offsetY,
      centerPosition.z + offsetZ
    );
    
    const ship = createNPC(type, position, nearestCelestialBodyId, fleetId);
    ships.push(ship);
  }
  
  return { fleet, ships };
}

// NPC Manager class to handle NPC behavior updates and state management
export class NPCManager {
  private npcs: Map<string, NpcShip> = new Map();
  private fleets: Map<string, NpcFleet> = new Map();
  private celestialBodies: Map<number, CelestialBody> = new Map();
  private lastUpdate: number = Date.now();
  
  constructor() {}
  
  // Create a fleet of NPCs
  createNPCFleet(
    type: NPCShipType,
    count: number,
    location: string,
    nearestCelestialBodyId: number,
  ): { fleet: NpcFleet, ships: NpcShip[] } {
    return createNPCFleet(type, count, location, nearestCelestialBodyId);
  }
  
  // Register a celestial body for reference
  registerCelestialBody(body: CelestialBody): void {
    this.celestialBodies.set(body.id, body);
  }
  
  // Register multiple celestial bodies
  registerCelestialBodies(bodies: CelestialBody[]): void {
    for (const body of bodies) {
      this.registerCelestialBody(body);
    }
  }
  
  // Register a single NPC
  registerNPC(npc: NpcShip): void {
    const entityId = `npc-${npc.id}`;
    this.npcs.set(entityId, npc);
  }
  
  // Register multiple NPCs
  registerNPCs(npcs: NpcShip[]): void {
    for (const npc of npcs) {
      this.registerNPC(npc);
    }
  }
  
  // Register a fleet
  registerFleet(fleet: NpcFleet): void {
    this.fleets.set(fleet.fleetId, fleet);
  }
  
  // Register multiple fleets
  registerFleets(fleets: NpcFleet[]): void {
    for (const fleet of fleets) {
      this.registerFleet(fleet);
    }
  }
  
  // Get a specific fleet by ID
  getFleet(fleetId: string): NpcFleet | undefined {
    return this.fleets.get(fleetId);
  }
  
  // Get all fleets
  getAllFleets(): NpcFleet[] {
    return Array.from(this.fleets.values());
  }
  
  // Get all NPCs in a specific fleet
  getNPCsByFleet(fleetId: string): NpcShip[] {
    return Array.from(this.npcs.values()).filter(npc => npc.fleetId === fleetId);
  }
  
  // Get all registered NPCs
  getAllNPCs(): NpcShip[] {
    return Array.from(this.npcs.values());
  }
  
  // Get NPCs near a position within a radius
  getNPCsNearPosition(position: Vector3, radius: number): NpcShip[] {
    return this.getAllNPCs().filter(npc => {
      const npcPosition = new Vector3(npc.positionX, npc.positionY, npc.positionZ);
      return npcPosition.distance(position) <= radius;
    });
  }
  
  // Convert NpcShip to NPCState for network transmission
  npcToState(npc: NpcShip): NPCState {
    return {
      entityId: `npc-${npc.id}`,
      npcType: npc.type as any,
      status: npc.status as any,
      position: new Vector3(npc.positionX, npc.positionY, npc.positionZ),
      velocity: new Vector3(npc.velocityX, npc.velocityY, npc.velocityZ),
      rotation: new Quaternion(npc.rotationX, npc.rotationY, npc.rotationZ, npc.rotationW),
      targetId: npc.targetId || undefined,
    };
  }
  
  // Update all NPCs
  update(deltaTime: number, currentTime: number): void {
    const npcs = this.getAllNPCs();
    
    for (const npc of npcs) {
      this.updateSingleNPC(npc, deltaTime, currentTime);
    }
    
    this.lastUpdate = Date.now();
  }
  
  // Update a single NPC's behavior and physics
  private updateSingleNPC(npc: NpcShip, deltaTime: number, currentTime: number): void {
    // Get the celestial body this NPC is near
    const celestialBody = this.celestialBodies.get(npc.nearestCelestialBodyId);
    
    // Current position and velocity
    const position = new Vector3(npc.positionX, npc.positionY, npc.positionZ);
    const velocity = new Vector3(npc.velocityX, npc.velocityY, npc.velocityZ);
    const rotation = new Quaternion(npc.rotationX, npc.rotationY, npc.rotationZ, npc.rotationW);
    
    // Parameters for this NPC type
    const params = NPC_PARAMETERS[npc.type as NPCShipType];
    
    // Calculate celestial body influence if available
    let gravityAccel = new Vector3(0, 0, 0);
    if (celestialBody) {
      // Get current celestial body position
      const bodyPosition = updateCelestialBodyPosition(
        celestialBody,
        0, // Assuming sun/central body has mass=0 for simplicity
        currentTime
      ).position;
      
      // Direction to celestial body
      const dirToCelestial = bodyPosition.subtract(position).normalize();
      
      // Simple gravity model
      const distToCelestial = position.distance(bodyPosition);
      const gravityStrength = 20.0 / (distToCelestial * distToCelestial);
      
      gravityAccel = dirToCelestial.multiply(gravityStrength);
    }
    
    // Update behavior based on AI state
    let targetAccel = new Vector3(0, 0, 0);
    
    switch (npc.aiState) {
      case NPCAIState.PATROLLING:
        // Simple patrol: move in current direction, periodically change
        if (Math.random() < 0.01) { // 1% chance per update to change direction
          const newDir = new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          
          targetAccel = newDir.multiply(params.maxAcceleration * 0.5);
        }
        break;
        
      case NPCAIState.ATTACKING:
        // Not implemented for now
        break;
        
      case NPCAIState.FLEEING:
        // Not implemented for now
        break;
        
      case NPCAIState.MINING:
        // Mining behavior: stay near celestial body and move slowly
        if (celestialBody) {
          const bodyPosition = updateCelestialBodyPosition(
            celestialBody,
            0,
            currentTime
          ).position;
          
          // Keep a certain distance from the body
          const optimalDistance = celestialBody.radius * 2;
          const currentDistance = position.distance(bodyPosition);
          
          if (currentDistance > optimalDistance * 1.2) {
            // Too far, move closer
            const dirToBody = bodyPosition.subtract(position).normalize();
            targetAccel = dirToBody.multiply(params.maxAcceleration * 0.3);
          } else if (currentDistance < optimalDistance * 0.8) {
            // Too close, move away
            const dirFromBody = position.subtract(bodyPosition).normalize();
            targetAccel = dirFromBody.multiply(params.maxAcceleration * 0.3);
          } else {
            // At good distance, orbit slowly
            const currentVelocity = velocity.magnitude();
            const orbitDir = position.subtract(bodyPosition).cross(new Vector3(0, 1, 0)).normalize();
            
            if (currentVelocity < params.maxSpeed * 0.3) {
              targetAccel = orbitDir.multiply(params.maxAcceleration * 0.2);
            }
          }
        }
        break;
        
      case NPCAIState.IDLE:
      default:
        // Slow down
        if (velocity.magnitude() > 1.0) {
          targetAccel = velocity.normalize().multiply(-params.maxAcceleration * 0.2);
        }
        break;
    }
    
    // Apply acceleration to velocity
    const newVelocity = velocity
      .add(targetAccel.multiply(deltaTime))
      .add(gravityAccel.multiply(deltaTime));
    
    // Limit velocity to max speed
    const speed = newVelocity.magnitude();
    const limitedVelocity = speed > params.maxSpeed
      ? newVelocity.normalize().multiply(params.maxSpeed)
      : newVelocity;
    
    // Update position based on velocity
    const newPosition = position.add(limitedVelocity.multiply(deltaTime));
    
    // Update rotation to face velocity direction if moving
    let newRotation = rotation;
    if (limitedVelocity.magnitude() > 1.0) {
      const targetDirection = limitedVelocity.normalize();
      
      // Calculate rotation to face direction
      const forward = new Vector3(0, 0, 1);
      const rotationAxis = forward.cross(targetDirection);
      
      if (rotationAxis.magnitude() > 0.001) {
        const angle = Math.acos(forward.dot(targetDirection));
        newRotation = Quaternion.fromAxisAngle(rotationAxis.normalize(), angle);
      }
    }
    
    // Update NPC state
    npc.positionX = newPosition.x;
    npc.positionY = newPosition.y;
    npc.positionZ = newPosition.z;
    npc.velocityX = limitedVelocity.x;
    npc.velocityY = limitedVelocity.y;
    npc.velocityZ = limitedVelocity.z;
    npc.rotationX = newRotation.x;
    npc.rotationY = newRotation.y;
    npc.rotationZ = newRotation.z;
    npc.rotationW = newRotation.w;
    
    // Occasionally change AI state
    if (Math.random() < 0.005) { // 0.5% chance per update
      this.transitionAIState(npc);
    }
  }
  
  // Handle AI state transitions
  private transitionAIState(npc: NpcShip): void {
    // Each NPC type has different state transition probabilities
    let nextState = npc.aiState;
    
    switch (npc.type) {
      case 'enemy':
        // Enemies mainly patrol or attack
        if (npc.aiState === NPCAIState.PATROLLING) {
          if (Math.random() < 0.3) {
            nextState = NPCAIState.ATTACKING;
          }
        } else if (npc.aiState === NPCAIState.ATTACKING) {
          if (Math.random() < 0.2) {
            nextState = NPCAIState.PATROLLING;
          } else if (Math.random() < 0.1) {
            nextState = NPCAIState.FLEEING;
          }
        } else if (npc.aiState === NPCAIState.FLEEING) {
          if (Math.random() < 0.5) {
            nextState = NPCAIState.PATROLLING;
          }
        }
        break;
        
      case 'transport':
        // Transports mainly patrol (move between locations)
        if (npc.aiState !== NPCAIState.PATROLLING && Math.random() < 0.7) {
          nextState = NPCAIState.PATROLLING;
        } else if (Math.random() < 0.2) {
          nextState = NPCAIState.DOCKING;
        }
        break;
        
      case 'civilian':
        // Civilians have varied behaviors
        const rand = Math.random();
        if (rand < 0.4) {
          nextState = NPCAIState.PATROLLING;
        } else if (rand < 0.7) {
          nextState = NPCAIState.IDLE;
        } else {
          nextState = NPCAIState.DOCKING;
        }
        break;
        
      case 'mining':
        // Mining ships mostly mine, occasionally move
        if (npc.aiState === NPCAIState.MINING) {
          if (Math.random() < 0.2) {
            nextState = NPCAIState.PATROLLING;
          }
        } else {
          if (Math.random() < 0.7) {
            nextState = NPCAIState.MINING;
          }
        }
        break;
    }
    
    npc.aiState = nextState;
    
    // Update status based on new AI state
    switch (nextState) {
      case NPCAIState.ATTACKING:
        npc.status = 'hostile';
        break;
      case NPCAIState.PATROLLING:
      case NPCAIState.DOCKING:
        npc.status = 'en-route';
        break;
      case NPCAIState.MINING:
        npc.status = 'working';
        break;
      case NPCAIState.IDLE:
      case NPCAIState.FLEEING:
      default:
        npc.status = 'passive';
        break;
    }
  }
  
  // Remove an NPC
  removeNPC(npcId: number): boolean {
    const entityId = `npc-${npcId}`;
    return this.npcs.delete(entityId);
  }
  
  // Remove a fleet and all its NPCs
  removeFleet(fleetId: string): void {
    // Remove the fleet
    this.fleets.delete(fleetId);
    
    // Remove all NPCs in the fleet
    const npcIds: number[] = [];
    this.npcs.forEach((npc, entityId) => {
      if (npc.fleetId === fleetId) {
        npcIds.push(npc.id);
      }
    });
    
    for (const npcId of npcIds) {
      this.removeNPC(npcId);
    }
  }
  
  // Clear all NPCs and fleets (used during world reset)
  clearAllNPCs(): void {
    // Clear all fleets
    this.fleets.clear();
    
    // Clear all NPCs
    this.npcs.clear();
    
    console.log('Cleared all NPCs and fleets from memory');
  }
}
