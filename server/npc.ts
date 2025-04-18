import { Vector3, Quaternion } from '@shared/math';
import { CelestialBody, NpcShip, NpcFleet, ShipTemplate } from '@shared/schema';
import { NPCState } from '@shared/types';
import { updateCelestialBodyPosition } from '@shared/physics';
import { storage } from './storage';

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
  // New states for advanced navigation
  WAYPOINT_FOLLOWING = 'waypoint_following',
  FORMATION_KEEPING = 'formation_keeping',
  OBSTACLE_AVOIDANCE = 'obstacle_avoidance',
}

// NPC navigation states
export enum NavigationState {
  NONE = 'none',
  PATHFINDING = 'pathfinding',
  WAYPOINT = 'waypoint',
  FORMATION = 'formation',
  MISSION = 'mission',
}

// NPC obstacle avoidance states
export enum AvoidanceState {
  NONE = 'none',
  ACTIVE = 'active',
  RECOVERING = 'recovering',
}

// NPC ship types
export type NPCShipType = 'enemy' | 'transport' | 'civilian' | 'mining';

// NPC ship status
export type NPCShipStatus = 'hostile' | 'en-route' | 'passive' | 'working';

// Waypoint interface for NPC navigation
export interface Waypoint {
  position: Vector3;
  radius: number;      // How close NPC must get to consider waypoint reached
  maxSpeed?: number;   // Speed limit near this waypoint
  waitTime?: number;   // Time to wait at waypoint in seconds
  isOptional?: boolean; // Can be skipped if blocked
}

// Fleet formation position
export interface FormationPosition {
  relativePosition: Vector3; // Position relative to fleet leader
  relativeRotation: Quaternion; // Rotation relative to fleet leader
}

// NPC ship parameters
interface NPCParameters {
  maxSpeed: number;
  turnRate: number;
  maxAcceleration: number;
  detectionRange: number;
  attackRange: number;
  fleeThreshold: number; // Health percentage to flee
  waypointArrivalDistance: number; // Distance to consider waypoint reached
  pathfindingUpdateInterval: number; // How often to update paths (ms)
  obstacleAvoidanceDistance: number; // Distance to begin obstacle avoidance
  formationKeepingTolerance: number; // Maximum distance from formation position
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
    waypointArrivalDistance: 100.0,
    pathfindingUpdateInterval: 5000,
    obstacleAvoidanceDistance: 200.0,
    formationKeepingTolerance: 50.0,
  },
  transport: {
    maxSpeed: 30.0,
    turnRate: 0.05,
    maxAcceleration: 5.0,
    detectionRange: 800.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.5,
    waypointArrivalDistance: 150.0,
    pathfindingUpdateInterval: 7000,
    obstacleAvoidanceDistance: 300.0,
    formationKeepingTolerance: 75.0,
  },
  civilian: {
    maxSpeed: 20.0,
    turnRate: 0.08,
    maxAcceleration: 4.0,
    detectionRange: 600.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.7,
    waypointArrivalDistance: 80.0,
    pathfindingUpdateInterval: 6000,
    obstacleAvoidanceDistance: 250.0,
    formationKeepingTolerance: 100.0,
  },
  mining: {
    maxSpeed: 15.0,
    turnRate: 0.03,
    maxAcceleration: 3.0,
    detectionRange: 500.0,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.4,
    waypointArrivalDistance: 50.0,
    pathfindingUpdateInterval: 10000,
    obstacleAvoidanceDistance: 150.0,
    formationKeepingTolerance: 40.0,
  },
};

// Utility function to create a basic NPC of a given type
export function createNPC(
  type: NPCShipType,
  position: Vector3,
  nearestCelestialBodyId: number,
  fleetId: string,
  templateId?: string
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
    templateId: templateId || null,
    waypointsJson: null,
    formationPosition: null,
    navigationState: NavigationState.NONE,
    pathCompletionPercent: 0,
    avoidanceState: AvoidanceState.NONE
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
  private shipTemplates: Map<string, ShipTemplate> = new Map();
  private lastUpdate: number = Date.now();
  
  constructor() {}
  
  // Create a fleet of NPCs with ship templates
  async createNPCFleet(
    type: NPCShipType,
    count: number,
    location: string,
    nearestCelestialBodyId: number,
  ): Promise<{ fleet: NpcFleet, ships: NpcShip[] }> {
    // Try to find a template for this ship type
    const template = this.getBestTemplateForType(type);
    const templateId = template?.templateId;
    
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
      
      // Create NPC ship with template ID if available
      const ship = createNPC(type, position, nearestCelestialBodyId, fleetId, templateId);
      ships.push(ship);
    }
    
    return { fleet, ships };
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
  
  // Register a ship template
  registerShipTemplate(template: ShipTemplate): void {
    this.shipTemplates.set(template.templateId, template);
  }
  
  // Register multiple ship templates
  registerShipTemplates(templates: ShipTemplate[]): void {
    for (const template of templates) {
      this.registerShipTemplate(template);
    }
  }
  
  // Get a template by ID
  getShipTemplate(templateId: string): ShipTemplate | undefined {
    return this.shipTemplates.get(templateId);
  }
  
  // Get all templates
  getAllShipTemplates(): ShipTemplate[] {
    return Array.from(this.shipTemplates.values());
  }
  
  // Get the best matching template for a ship type
  getBestTemplateForType(type: NPCShipType): ShipTemplate | undefined {
    // Find all templates matching this ship type
    const matchingTemplates = this.getAllShipTemplates().filter(template => 
      template.type === type
    );
    
    if (matchingTemplates.length === 0) {
      return undefined;
    }
    
    // For now, just return the first matching template
    // In the future, we could implement more sophisticated selection logic
    return matchingTemplates[0];
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
  // Set waypoints for an NPC
  setWaypoints(npcId: number, waypoints: Waypoint[]): boolean {
    const entityId = `npc-${npcId}`;
    const npc = this.npcs.get(entityId);
    
    if (npc) {
      npc.waypointsJson = JSON.stringify(waypoints);
      npc.navigationState = NavigationState.WAYPOINT;
      npc.aiState = NPCAIState.WAYPOINT_FOLLOWING;
      npc.pathCompletionPercent = 0;
      
      return true;
    }
    
    return false;
  }
  
  // Get waypoints for an NPC
  getWaypoints(npcId: number): Waypoint[] | null {
    const entityId = `npc-${npcId}`;
    const npc = this.npcs.get(entityId);
    
    if (npc && npc.waypointsJson && typeof npc.waypointsJson === 'string') {
      try {
        return JSON.parse(npc.waypointsJson);
      } catch (e) {
        console.error(`Error parsing waypoints for NPC ${npcId}:`, e);
        return null;
      }
    }
    
    return null;
  }
  
  // Set a fleet to follow a formation
  setFleetFormation(fleetId: string, leaderNpcId: number): boolean {
    const npcs = this.getNPCsByFleet(fleetId);
    if (npcs.length === 0) return false;
    
    // Find leader
    const leader = npcs.find(npc => npc.id === leaderNpcId);
    if (!leader) return false;
    
    // Create a circular formation
    const formationRadius = 200.0;
    const formationHeight = 50.0;
    
    for (let i = 0; i < npcs.length; i++) {
      if (npcs[i].id === leaderNpcId) {
        // Leader doesn't need formation position
        continue;
      }
      
      // Assign position in formation
      const angle = (i / npcs.length) * Math.PI * 2;
      const formationPos = i % 4 === 0 ? i / 4 : i; // This creates formation positions 0, 1, 2, 3, etc.
      
      npcs[i].formationPosition = formationPos;
      npcs[i].navigationState = NavigationState.FORMATION;
      npcs[i].aiState = NPCAIState.FORMATION_KEEPING;
    }
    
    return true;
  }
  
  // Find obstacles near a position
  findObstaclesNear(position: Vector3, radius: number): { position: Vector3, radius: number }[] {
    const obstacles: { position: Vector3, radius: number }[] = [];
    
    // Consider celestial bodies as obstacles
    for (const [_, celestialBody] of this.celestialBodies.entries()) {
      const bodyPosition = new Vector3(
        celestialBody.currentPositionX || 0, 
        celestialBody.currentPositionY || 0, 
        celestialBody.currentPositionZ || 0
      );
      
      if (position.distance(bodyPosition) < radius + celestialBody.radius) {
        obstacles.push({
          position: bodyPosition,
          radius: celestialBody.radius
        });
      }
    }
    
    // Consider NPCs as obstacles (except self)
    for (const [_, npc] of this.npcs.entries()) {
      const npcPosition = new Vector3(npc.positionX, npc.positionY, npc.positionZ);
      
      if (position.distance(npcPosition) < radius + 10) { // Assume NPC has radius of 10
        obstacles.push({
          position: npcPosition,
          radius: 10
        });
      }
    }
    
    return obstacles;
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
    
    // Get parameters either from template or default
    let params: NPCParameters;
    
    // First try to get parameters from template if this NPC has one
    if (npc.templateId) {
      const template = this.getShipTemplate(npc.templateId);
      if (template) {
        // Use parameters from the template
        params = {
          maxSpeed: template.maxSpeed,
          turnRate: template.turnRate,
          maxAcceleration: template.maxAcceleration,
          detectionRange: template.detectionRange,
          attackRange: template.attackRange,
          fleeThreshold: template.fleeThreshold,
          waypointArrivalDistance: template.waypointArrivalDistance,
          pathfindingUpdateInterval: template.pathfindingUpdateInterval,
          obstacleAvoidanceDistance: template.obstacleAvoidanceDistance,
          formationKeepingTolerance: template.formationKeepingTolerance
        };
      } else {
        // Fallback to defaults if template not found
        params = NPC_PARAMETERS[npc.type as NPCShipType];
      }
    } else {
      // Use default parameters if no template is assigned
      params = NPC_PARAMETERS[npc.type as NPCShipType];
    }
    
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
        
      case NPCAIState.WAYPOINT_FOLLOWING:
        // Follow waypoints if available
        if (npc.waypointsJson && typeof npc.waypointsJson === 'string') {
          try {
            const parsedWaypoints = JSON.parse(npc.waypointsJson);
            
            // Convert the parsed waypoints to proper Waypoint objects with Vector3 positions
            const waypoints: Waypoint[] = parsedWaypoints.map((wp: any) => ({
              position: new Vector3(wp.position.x, wp.position.y, wp.position.z),
              radius: wp.radius,
              maxSpeed: wp.maxSpeed,
              waitTime: wp.waitTime,
              isOptional: wp.isOptional
            }));
            
            if (waypoints.length > 0) {
              // Get current waypoint
              const currentWaypoint = waypoints[0];
              
              // Calculate direction and distance to waypoint
              const waypointPos = currentWaypoint.position;
              const dirToWaypoint = waypointPos.subtract(position).normalize();
              const distanceToWaypoint = position.distance(waypointPos);
              
              // Check if we've reached the waypoint
              if (distanceToWaypoint <= params.waypointArrivalDistance) {
                // Remove the first waypoint
                waypoints.shift();
                
                // Update completion percentage
                const waypointCount = waypoints.length;
                npc.pathCompletionPercent = waypointCount > 0 
                  ? (1 - waypointCount / (waypointCount + 1)) * 100
                  : 100;
                
                // If all waypoints completed, go back to patrolling
                if (waypoints.length === 0) {
                  npc.aiState = NPCAIState.PATROLLING;
                  npc.navigationState = NavigationState.NONE;
                  npc.waypointsJson = null;
                } else {
                  // Update waypoints in NPC
                  npc.waypointsJson = JSON.stringify(waypoints);
                }
              } else {
                // Move towards the waypoint
                let targetSpeed = params.maxSpeed;
                
                // Use waypoint's speed limit if specified
                if (currentWaypoint.maxSpeed && currentWaypoint.maxSpeed < targetSpeed) {
                  targetSpeed = currentWaypoint.maxSpeed;
                }
                
                // Slow down as we approach the waypoint
                if (distanceToWaypoint < params.waypointArrivalDistance * 3) {
                  targetSpeed *= (distanceToWaypoint / (params.waypointArrivalDistance * 3));
                  targetSpeed = Math.max(targetSpeed, params.maxSpeed * 0.2); // Don't go too slow
                }
                
                // Calculate acceleration needed to reach target speed in target direction
                const currentVelocityInTargetDirection = velocity.dot(dirToWaypoint);
                const speedDifference = targetSpeed - currentVelocityInTargetDirection;
                
                targetAccel = dirToWaypoint.multiply(speedDifference * 2.0); // Use PD controller
                
                // Limit acceleration
                const accelMagnitude = targetAccel.magnitude();
                if (accelMagnitude > params.maxAcceleration) {
                  targetAccel = targetAccel.multiply(params.maxAcceleration / accelMagnitude);
                }
              }
            } else {
              // No waypoints left, go back to patrolling
              npc.aiState = NPCAIState.PATROLLING;
              npc.navigationState = NavigationState.NONE;
              npc.waypointsJson = null;
            }
          } catch (err) {
            console.error(`Error parsing waypoints for NPC ${npc.id}:`, err);
            npc.aiState = NPCAIState.PATROLLING;
            npc.navigationState = NavigationState.NONE;
            npc.waypointsJson = null;
          }
        } else {
          // No waypoints available, go back to patrolling
          npc.aiState = NPCAIState.PATROLLING;
          npc.navigationState = NavigationState.NONE;
        }
        break;
        
      case NPCAIState.FORMATION_KEEPING:
        // Keep position in formation relative to leader
        if (npc.formationPosition !== null && npc.navigationState === NavigationState.FORMATION) {
          // Get all NPCs in this fleet to find the leader
          const fleetNpcs = Array.from(this.npcs.values()).filter(n => n.fleetId === npc.fleetId);
          
          // Leader is the one with null formation position
          const leader = fleetNpcs.find(n => n.formationPosition === null);
          
          if (leader) {
            // Calculate desired position in formation
            const leaderPos = new Vector3(leader.positionX, leader.positionY, leader.positionZ);
            const leaderRot = new Quaternion(leader.rotationX, leader.rotationY, leader.rotationZ, leader.rotationW);
            const leaderVel = new Vector3(leader.velocityX, leader.velocityY, leader.velocityZ);
            
            // Position based on formation position value
            const formationPos = npc.formationPosition as number;
            const formationRadius = 200.0;
            const formationHeight = 50.0;
            
            // Calculate formation position (circular pattern around leader)
            const angle = (formationPos / fleetNpcs.length) * Math.PI * 2;
            const relativeX = Math.cos(angle) * formationRadius;
            const relativeY = Math.sin(angle) * formationRadius;
            const relativeZ = (formationPos % 2 === 0 ? 1 : -1) * formationHeight;
            
            // Rotate relative position by leader's rotation
            const relativePosition = new Vector3(relativeX, relativeY, relativeZ);
            const rotatedPosition = leaderRot.rotateVector(relativePosition);
            
            // Calculate target position
            const targetPosition = leaderPos.add(rotatedPosition);
            
            // Move towards target position
            const dirToTarget = targetPosition.subtract(position).normalize();
            const distanceToTarget = position.distance(targetPosition);
            
            // Calculate target velocity (include leader's velocity)
            let targetSpeed = params.maxSpeed;
            
            // Faster speed when far, slower when close
            if (distanceToTarget < params.formationKeepingTolerance * 3) {
              targetSpeed *= (distanceToTarget / (params.formationKeepingTolerance * 3));
              targetSpeed = Math.max(targetSpeed, params.maxSpeed * 0.3);
            }
            
            // Add leader's velocity component 
            const leaderVelMagnitude = leaderVel.magnitude();
            const targetVelocity = dirToTarget.multiply(targetSpeed).add(leaderVel);
            
            // Calculate acceleration
            const velocityDifference = targetVelocity.subtract(velocity);
            targetAccel = velocityDifference.multiply(2.0); // PD controller
            
            // Limit acceleration
            const accelMagnitude = targetAccel.magnitude();
            if (accelMagnitude > params.maxAcceleration) {
              targetAccel = targetAccel.multiply(params.maxAcceleration / accelMagnitude);
            }
          } else {
            // No leader found, fall back to patrolling
            npc.aiState = NPCAIState.PATROLLING;
            npc.navigationState = NavigationState.NONE;
            npc.formationPosition = null;
          }
        } else {
          // Not in formation, fall back to patrolling
          npc.aiState = NPCAIState.PATROLLING;
          npc.navigationState = NavigationState.NONE;
          npc.formationPosition = null;
        }
        break;
        
      case NPCAIState.OBSTACLE_AVOIDANCE:
        // Implement obstacle avoidance
        if (npc.avoidanceState === AvoidanceState.ACTIVE) {
          // Find nearby obstacles
          const obstacles = this.findObstaclesNear(position, params.obstacleAvoidanceDistance);
          
          if (obstacles.length > 0) {
            // Calculate avoidance vector (away from all obstacles)
            let avoidanceDir = new Vector3(0, 0, 0);
            
            for (const obstacle of obstacles) {
              const dirFromObstacle = position.subtract(obstacle.position).normalize();
              const distance = Math.max(position.distance(obstacle.position) - obstacle.radius, 0.1);
              const weight = 1.0 / (distance * distance); // Weight by inverse square of distance
              
              avoidanceDir = avoidanceDir.add(dirFromObstacle.multiply(weight));
            }
            
            // Normalize and apply avoidance
            if (avoidanceDir.magnitude() > 0.001) {
              avoidanceDir = avoidanceDir.normalize();
              targetAccel = avoidanceDir.multiply(params.maxAcceleration);
            } else {
              // No significant avoidance direction, transition to recovering
              npc.avoidanceState = AvoidanceState.RECOVERING;
            }
          } else {
            // No obstacles, transition to recovering
            npc.avoidanceState = AvoidanceState.RECOVERING;
          }
        } else if (npc.avoidanceState === AvoidanceState.RECOVERING) {
          // Transition back to previous state
          if (npc.navigationState === NavigationState.WAYPOINT) {
            npc.aiState = NPCAIState.WAYPOINT_FOLLOWING;
          } else if (npc.navigationState === NavigationState.FORMATION) {
            npc.aiState = NPCAIState.FORMATION_KEEPING;
          } else {
            npc.aiState = NPCAIState.PATROLLING;
          }
          
          npc.avoidanceState = AvoidanceState.NONE;
        } else {
          // Invalid state, go back to patrolling
          npc.aiState = NPCAIState.PATROLLING;
          npc.avoidanceState = AvoidanceState.NONE;
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
    
    // Check for obstacles before finalizing movement
    // Only check if we're not already avoiding obstacles and we're not idle
    if (npc.aiState !== NPCAIState.OBSTACLE_AVOIDANCE && npc.aiState !== NPCAIState.IDLE) {
      const obstacles = this.findObstaclesNear(position, params.obstacleAvoidanceDistance);
      
      // If obstacles are found, transition to obstacle avoidance
      if (obstacles.length > 0) {
        // Check if any obstacles are in our current path
        let needsAvoidance = false;
        
        for (const obstacle of obstacles) {
          // Calculate how close we'll get to the obstacle if we continue on current path
          const obstaclePos = obstacle.position;
          const obstacleRadius = obstacle.radius;
          
          // Vector from current position to obstacle
          const toObstacle = obstaclePos.subtract(position);
          
          // Project current velocity onto that vector to see if we're heading toward obstacle
          const currentSpeed = velocity.magnitude();
          if (currentSpeed > 0.001) { // Only if we're moving
            const normalizedVelocity = velocity.multiply(1.0 / currentSpeed);
            const dotProduct = toObstacle.dot(normalizedVelocity);
            
            // If dotProduct > 0, we're heading toward the obstacle
            if (dotProduct > 0) {
              // Calculate closest approach distance
              const closestApproachVector = normalizedVelocity.multiply(dotProduct);
              const perpendicularVector = toObstacle.subtract(closestApproachVector);
              const closestDistance = perpendicularVector.magnitude();
              
              // If closest approach is within obstacle radius plus safety margin, avoid
              if (closestDistance < obstacleRadius + 50.0) {
                needsAvoidance = true;
                break;
              }
            }
          }
        }
        
        if (needsAvoidance) {
          // Remember current navigation state to return to after avoidance
          npc.aiState = NPCAIState.OBSTACLE_AVOIDANCE;
          npc.avoidanceState = AvoidanceState.ACTIVE;
          
          // Recalculate acceleration for this frame to initiate avoidance
          let avoidanceDir = new Vector3(0, 0, 0);
          
          for (const obstacle of obstacles) {
            const dirFromObstacle = position.subtract(obstacle.position).normalize();
            const distance = Math.max(position.distance(obstacle.position) - obstacle.radius, 0.1);
            const weight = 1.0 / (distance * distance);
            
            avoidanceDir = avoidanceDir.add(dirFromObstacle.multiply(weight));
          }
          
          if (avoidanceDir.magnitude() > 0.001) {
            avoidanceDir = avoidanceDir.normalize();
            targetAccel = avoidanceDir.multiply(params.maxAcceleration);
          }
        }
      }
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
