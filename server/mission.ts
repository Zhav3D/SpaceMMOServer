import { Vector3 } from '@shared/math';
import { MissionType, MissionStatus, MissionState } from '@shared/types';
import { Mission } from '@shared/schema';
import { UDPServer } from './udp';
import { GameStateManager } from './state';
import { NPCManager } from './npc';
import { CelestialManager } from './celestial';
import { v4 as uuidv4 } from 'uuid';

/**
 * The MissionManager handles all game missions including:
 * - Creating and assigning missions to NPC fleets
 * - Generating random missions based on the state of the game world
 * - Tracking mission progress and completion
 * - Providing mission information to players
 */
export class MissionManager {
  private missions: Map<string, Mission> = new Map();
  private activeMissions: Map<string, Mission> = new Map();
  private completedMissions: Map<string, Mission> = new Map();
  private failedMissions: Map<string, Mission> = new Map();
  
  private udpServer: UDPServer;
  private gameStateManager: GameStateManager;
  private npcManager: NPCManager;
  private celestialManager: CelestialManager;
  
  private missionTypeProbabilities: Record<MissionType, number> = {
    [MissionType.COMBAT]: 0.2,
    [MissionType.TRADE]: 0.3,
    [MissionType.MINING]: 0.2,
    [MissionType.ESCORT]: 0.1,
    [MissionType.EXPLORATION]: 0.05,
    [MissionType.DELIVERY]: 0.1,
    [MissionType.RESCUE]: 0.03,
    [MissionType.PATROL]: 0.02
  };
  
  private missionExpiryTimes: Record<MissionType, number> = {
    [MissionType.COMBAT]: 3600, // 1 hour in seconds
    [MissionType.TRADE]: 7200, // 2 hours in seconds
    [MissionType.MINING]: 5400, // 1.5 hours in seconds
    [MissionType.ESCORT]: 3600, // 1 hour in seconds
    [MissionType.EXPLORATION]: 10800, // 3 hours in seconds
    [MissionType.DELIVERY]: 4500, // 1.25 hours in seconds
    [MissionType.RESCUE]: 1800, // 30 minutes in seconds
    [MissionType.PATROL]: 2700  // 45 minutes in seconds
  };
  
  private missionRewards: Record<MissionType, number[]> = {
    [MissionType.COMBAT]: [500, 1000, 2000, 4000, 8000],
    [MissionType.TRADE]: [400, 800, 1600, 3200, 6400],
    [MissionType.MINING]: [300, 600, 1200, 2400, 4800],
    [MissionType.ESCORT]: [600, 1200, 2400, 4800, 9600],
    [MissionType.EXPLORATION]: [700, 1400, 2800, 5600, 11200],
    [MissionType.DELIVERY]: [350, 700, 1400, 2800, 5600],
    [MissionType.RESCUE]: [800, 1600, 3200, 6400, 12800],
    [MissionType.PATROL]: [450, 900, 1800, 3600, 7200]
  };
  
  private missionDescriptions: Record<MissionType, string[]> = {
    [MissionType.COMBAT]: [
      "Eliminate hostile ships threatening local shipping routes.",
      "Destroy pirate vessels attacking trade convoys.",
      "Neutralize enemy forces gathering near strategic locations.",
      "Clear out hostile forces from an abandoned station.",
      "Defend key infrastructure from imminent attack."
    ],
    [MissionType.TRADE]: [
      "Transport valuable commodities between trading posts.",
      "Deliver rare materials to research facilities.",
      "Move industrial supplies to developing colonies.",
      "Establish new trade routes between settlements.",
      "Acquire and transport scarce resources to production facilities."
    ],
    [MissionType.MINING]: [
      "Extract valuable minerals from asteroid fields.",
      "Harvest rare gases from planetary atmospheres.",
      "Collect precious metals from unstable celestial bodies.",
      "Mine exotic elements needed for advanced research.",
      "Gather resources from hazardous regions with high radiation."
    ],
    [MissionType.ESCORT]: [
      "Protect VIP transport ships during their journey.",
      "Guard relief convoys heading to disaster zones.",
      "Escort scientific exploration vessels through dangerous sectors.",
      "Defend diplomatic missions during sensitive negotiations.",
      "Protect colony ships establishing new outposts."
    ],
    [MissionType.EXPLORATION]: [
      "Scan uncharted regions to update navigational data.",
      "Investigate anomalous signals in deep space.",
      "Document newly discovered celestial phenomena.",
      "Search for signs of ancient civilizations.",
      "Map dangerous but resource-rich regions of space."
    ],
    [MissionType.DELIVERY]: [
      "Deliver urgent medical supplies to outbreak zones.",
      "Transport time-sensitive data packages between research stations.",
      "Rush critical replacement parts to disabled infrastructure.",
      "Deliver diplomatic communications during times of conflict.",
      "Transport experimental technology prototypes to testing facilities."
    ],
    [MissionType.RESCUE]: [
      "Extract personnel from a facility under attack.",
      "Rescue stranded crews from disabled vessels.",
      "Evacuate civilians from regions facing imminent danger.",
      "Recover escape pods lost in deep space.",
      "Save research teams trapped in unstable environments."
    ],
    [MissionType.PATROL]: [
      "Monitor key trade routes for suspicious activity.",
      "Guard planetary orbit against unauthorized access.",
      "Perform routine security sweeps around sensitive installations.",
      "Maintain presence in contested territories.",
      "Conduct regular inspections of checkpoints and border crossings."
    ]
  };
  
  constructor(
    udpServer: UDPServer,
    gameStateManager: GameStateManager,
    npcManager: NPCManager,
    celestialManager: CelestialManager
  ) {
    this.udpServer = udpServer;
    this.gameStateManager = gameStateManager;
    this.npcManager = npcManager;
    this.celestialManager = celestialManager;
  }
  
  /**
   * Initialize the mission system
   */
  async initialize(): Promise<void> {
    console.log('Initializing mission system...');
    this.generateInitialMissions();
    
    // Start mission generation on a timer
    setInterval(() => {
      this.generateRandomMission();
    }, 60000); // Generate a new mission every minute
    
    // Update mission status every 5 seconds
    setInterval(() => {
      this.updateMissions();
    }, 5000);
  }
  
  /**
   * Generate initial set of missions at startup
   */
  private generateInitialMissions(): void {
    // Create a batch of initial missions across different types
    const initialCount = 10;
    for (let i = 0; i < initialCount; i++) {
      this.generateRandomMission();
    }
    console.log(`Generated ${initialCount} initial missions`);
  }
  
  /**
   * Generate a single random mission
   */
  private generateRandomMission(): Mission {
    // Determine mission type based on probabilities
    const missionType = this.selectRandomMissionType();
    
    // Get available celestial bodies for mission locations
    const celestialBodies = this.celestialManager.getAllBodies();
    if (celestialBodies.length < 2) {
      console.warn('Not enough celestial bodies to create missions');
      return null;
    }
    
    // Select random start and end locations (different from each other)
    const startLocationIndex = Math.floor(Math.random() * celestialBodies.length);
    let endLocationIndex = startLocationIndex;
    while (endLocationIndex === startLocationIndex) {
      endLocationIndex = Math.floor(Math.random() * celestialBodies.length);
    }
    
    const startLocation = celestialBodies[startLocationIndex];
    const endLocation = celestialBodies[endLocationIndex];
    
    // Determine mission difficulty (1-5)
    const difficulty = Math.floor(Math.random() * 5) + 1;
    
    // Calculate mission reward based on type and difficulty
    const reward = this.missionRewards[missionType][difficulty - 1];
    
    // Generate mission progress target based on type and difficulty
    let progressTarget = 1;
    switch (missionType) {
      case MissionType.COMBAT:
        progressTarget = difficulty * 5; // Number of enemies to defeat
        break;
      case MissionType.MINING:
        progressTarget = difficulty * 10; // Units to mine
        break;
      case MissionType.TRADE:
        progressTarget = difficulty * 2; // Deliveries to complete
        break;
      case MissionType.DELIVERY:
        progressTarget = 1; // Single delivery
        break;
      default:
        progressTarget = difficulty * 2; // Default progression goal
    }
    
    // Calculate expiration time based on mission type
    const startTime = Date.now() / 1000; // Current time in seconds
    const expiryTime = startTime + this.missionExpiryTimes[missionType];
    
    // Generate mission name
    const missionNames = [
      `Operation ${this.generateRandomName()}`,
      `Project ${this.generateRandomName()}`,
      `Mission ${this.generateRandomName()}`,
      `Task ${this.generateRandomName()}`,
      `Directive ${this.generateRandomName()}`
    ];
    const name = missionNames[Math.floor(Math.random() * missionNames.length)];
    
    // Select a description from the predefined list for this mission type
    const descriptions = this.missionDescriptions[missionType];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Create the mission object
    const missionId = uuidv4();
    const mission: Mission = {
      id: 0, // Will be assigned by database
      missionId,
      name,
      description,
      type: missionType,
      status: MissionStatus.ACTIVE,
      reward,
      difficulty,
      startLocationId: startLocation.id,
      endLocationId: endLocation.id,
      assignedFleetId: null, // Will be assigned later
      progressValue: 0,
      progressTarget,
      startTime,
      expiryTime,
      completeTime: null
    };
    
    // Store the mission
    this.missions.set(missionId, mission);
    this.activeMissions.set(missionId, mission);
    
    console.log(`Generated new ${missionType} mission: ${name}`);
    return mission;
  }
  
  /**
   * Select a random mission type based on defined probabilities
   */
  private selectRandomMissionType(): MissionType {
    const rand = Math.random();
    let cumulativeProbability = 0;
    
    for (const type of Object.values(MissionType)) {
      cumulativeProbability += this.missionTypeProbabilities[type];
      if (rand < cumulativeProbability) {
        return type;
      }
    }
    
    // Default in case probabilities don't add up to 1
    return MissionType.COMBAT;
  }
  
  /**
   * Generate a random name for mission titles
   */
  private generateRandomName(): string {
    const adjectives = [
      'Swift', 'Valiant', 'Crimson', 'Stellar', 'Phantom', 'Cosmic', 'Astral',
      'Nova', 'Solar', 'Void', 'Quantum', 'Galactic', 'Dynamic', 'Eternal',
      'Nebula', 'Eclipse', 'Radiant', 'Lunar', 'Comet', 'Phoenix'
    ];
    
    const nouns = [
      'Destiny', 'Horizon', 'Vanguard', 'Dawn', 'Sentinel', 'Oracle', 'Guardian',
      'Pioneer', 'Voyager', 'Hammer', 'Shield', 'Falcon', 'Warden', 'Titan',
      'Envoy', 'Harbinger', 'Interceptor', 'Pathfinder', 'Nomad', 'Defender'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
  }
  
  /**
   * Update all active missions - check for completions, failures, and expirations
   */
  private updateMissions(): void {
    const currentTime = Date.now() / 1000; // Current time in seconds
    
    // Check each active mission
    for (const [missionId, mission] of this.activeMissions.entries()) {
      // Check for expired missions
      if (currentTime > mission.expiryTime) {
        this.failMission(missionId, 'expired');
        continue;
      }
      
      // Check for completed missions
      if (mission.progressValue >= mission.progressTarget) {
        this.completeMission(missionId);
        continue;
      }
      
      // Update mission progress based on mission type
      this.updateMissionProgress(mission);
    }
  }
  
  /**
   * Update the progress of a specific mission based on its type
   */
  private updateMissionProgress(mission: Mission): void {
    // If the mission isn't assigned to a fleet, try to assign one
    if (!mission.assignedFleetId) {
      this.assignFleetToMission(mission);
      return;
    }
    
    // Get the assigned fleet
    const fleet = this.npcManager.getFleet(mission.assignedFleetId);
    if (!fleet) {
      // Fleet no longer exists, unassign
      mission.assignedFleetId = null;
      return;
    }
    
    // Check if fleet is near mission end location
    const fleetShips = this.npcManager.getNPCsByFleet(mission.assignedFleetId);
    if (fleetShips.length === 0) return;
    
    // Use the first ship to represent fleet position
    const fleetPosition = new Vector3(
      fleetShips[0].positionX,
      fleetShips[0].positionY,
      fleetShips[0].positionZ
    );
    
    // Get end location celestial body
    const endLocation = this.celestialManager.getBody(mission.endLocationId);
    if (!endLocation) return;
    
    // Calculate position of end location
    const endPosition = new Vector3(
      endLocation.currentPositionX || 0,
      endLocation.currentPositionY || 0,
      endLocation.currentPositionZ || 0
    );
    
    // Check distance to end location
    const distanceToEnd = fleetPosition.distance(endPosition);
    const arrivalThreshold = endLocation.radius * 3; // Must be within 3x radius
    
    if (distanceToEnd <= arrivalThreshold) {
      // Fleet has arrived at destination
      switch (mission.type) {
        case MissionType.TRADE:
        case MissionType.DELIVERY:
          // Complete the delivery immediately
          mission.progressValue = mission.progressTarget;
          break;
          
        case MissionType.PATROL:
          // Increment patrol progress more slowly
          mission.progressValue += 0.05;
          break;
          
        case MissionType.MINING:
          // Mining accumulates resources over time
          mission.progressValue += 0.2;
          break;
          
        case MissionType.COMBAT:
          // Combat missions need enemy engagements, simulated progress
          mission.progressValue += 0.1;
          break;
          
        default:
          // Default progression is slower
          mission.progressValue += 0.1;
      }
    } else {
      // For exploration missions, progress increases as they travel
      if (mission.type === MissionType.EXPLORATION) {
        mission.progressValue += 0.03;
      }
    }
  }
  
  /**
   * Assign an appropriate NPC fleet to a mission
   */
  private assignFleetToMission(mission: Mission): void {
    // Get fleets that aren't already assigned to missions
    const allFleets = this.npcManager.getAllFleets();
    const assignedFleetIds = new Set<string>();
    
    this.activeMissions.forEach(m => {
      if (m.assignedFleetId) {
        assignedFleetIds.add(m.assignedFleetId);
      }
    });
    
    // Filter fleets that are:
    // 1. Not already assigned
    // 2. Match the mission type requirements
    const availableFleets = allFleets.filter(fleet => {
      if (assignedFleetIds.has(fleet.fleetId)) return false;
      
      // Match fleet types to mission types
      switch (mission.type) {
        case MissionType.COMBAT:
          return fleet.type === 'enemy';
        case MissionType.TRADE:
        case MissionType.DELIVERY:
          return fleet.type === 'transport';
        case MissionType.MINING:
          return fleet.type === 'mining';
        case MissionType.ESCORT:
        case MissionType.PATROL:
          return fleet.type === 'enemy' || fleet.type === 'transport';
        case MissionType.RESCUE:
          return fleet.type === 'transport' || fleet.type === 'civilian';
        case MissionType.EXPLORATION:
          return fleet.type === 'civilian';
        default:
          return true;
      }
    });
    
    if (availableFleets.length > 0) {
      // Select a random available fleet
      const fleetIndex = Math.floor(Math.random() * availableFleets.length);
      const selectedFleet = availableFleets[fleetIndex];
      
      // Assign the fleet to the mission
      mission.assignedFleetId = selectedFleet.fleetId;
      console.log(`Assigned ${selectedFleet.type} fleet ${selectedFleet.fleetId} to mission ${mission.missionId}`);
      
      // Update the fleet's behavior based on mission type
      this.updateFleetBehaviorForMission(selectedFleet, mission);
    }
  }
  
  /**
   * Update a fleet's behavior based on its assigned mission
   */
  private updateFleetBehaviorForMission(fleet: any, mission: Mission): void {
    // Set fleet's target to the mission end location
    const fleetShips = this.npcManager.getNPCsByFleet(fleet.fleetId);
    
    // Assign appropriate behaviors based on mission type
    fleetShips.forEach(ship => {
      switch (mission.type) {
        case MissionType.COMBAT:
          ship.aiState = 'attacking';
          ship.status = 'hostile';
          break;
        case MissionType.MINING:
          ship.aiState = 'mining';
          ship.status = 'working';
          break;
        case MissionType.TRADE:
        case MissionType.DELIVERY:
          ship.aiState = 'patrolling';
          ship.status = 'en-route';
          break;
        case MissionType.ESCORT:
          ship.aiState = 'escorting';
          ship.status = 'passive';
          break;
        case MissionType.EXPLORATION:
          ship.aiState = 'patrolling';
          ship.status = 'passive';
          break;
        case MissionType.PATROL:
          ship.aiState = 'patrolling';
          ship.status = 'passive';
          break;
        case MissionType.RESCUE:
          ship.aiState = 'patrolling';
          ship.status = 'en-route';
          break;
      }
      
      // Update the nearest celestial body to the mission target
      ship.nearestCelestialBodyId = mission.endLocationId;
    });
  }
  
  /**
   * Mark a mission as completed
   */
  private completeMission(missionId: string): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;
    
    // Update mission status
    mission.status = MissionStatus.COMPLETED;
    mission.completeTime = Date.now() / 1000;
    
    // Move from active to completed missions
    this.activeMissions.delete(missionId);
    this.completedMissions.set(missionId, mission);
    
    console.log(`Mission ${mission.missionId} (${mission.name}) completed!`);
    
    // Free up the assigned fleet for other missions
    if (mission.assignedFleetId) {
      const fleet = this.npcManager.getFleet(mission.assignedFleetId);
      if (fleet) {
        // Reset fleet behavior
        const fleetShips = this.npcManager.getNPCsByFleet(fleet.fleetId);
        fleetShips.forEach(ship => {
          ship.aiState = 'patrolling';
          ship.status = 'passive';
        });
      }
    }
  }
  
  /**
   * Mark a mission as failed
   */
  private failMission(missionId: string, reason: string): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;
    
    // Update mission status
    mission.status = MissionStatus.FAILED;
    mission.completeTime = Date.now() / 1000;
    
    // Move from active to failed missions
    this.activeMissions.delete(missionId);
    this.failedMissions.set(missionId, mission);
    
    console.log(`Mission ${mission.missionId} (${mission.name}) failed: ${reason}`);
    
    // Free up the assigned fleet
    if (mission.assignedFleetId) {
      const fleet = this.npcManager.getFleet(mission.assignedFleetId);
      if (fleet) {
        // Reset fleet behavior
        const fleetShips = this.npcManager.getNPCsByFleet(fleet.fleetId);
        fleetShips.forEach(ship => {
          ship.aiState = 'patrolling';
          ship.status = 'passive';
        });
      }
    }
  }
  
  /**
   * Get all active missions
   */
  getAllActiveMissions(): Mission[] {
    return Array.from(this.activeMissions.values());
  }
  
  /**
   * Get all completed missions
   */
  getAllCompletedMissions(): Mission[] {
    return Array.from(this.completedMissions.values());
  }
  
  /**
   * Get all failed missions
   */
  getAllFailedMissions(): Mission[] {
    return Array.from(this.failedMissions.values());
  }
  
  /**
   * Get a specific mission by ID
   */
  getMission(missionId: string): Mission | undefined {
    return this.missions.get(missionId);
  }
  
  /**
   * Convert a mission to a MissionState for network transmission
   */
  missionToState(mission: Mission): MissionState {
    return {
      missionId: mission.missionId,
      name: mission.name,
      description: mission.description,
      type: mission.type as MissionType,
      status: mission.status as MissionStatus,
      reward: mission.reward,
      difficulty: mission.difficulty,
      startLocationId: mission.startLocationId,
      endLocationId: mission.endLocationId,
      assignedFleetId: mission.assignedFleetId || undefined,
      progressValue: mission.progressValue,
      progressTarget: mission.progressTarget,
      startTime: mission.startTime,
      expiryTime: mission.expiryTime,
      completeTime: mission.completeTime || undefined
    };
  }
}