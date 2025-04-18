# Mission System

This document details the mission generation and management system in Orbital Nexus, which creates dynamic content and drives NPC behavior.

## Overview

The Mission System is responsible for generating, assigning, tracking, and completing missions throughout the game world. It provides purpose and direction for NPCs and creates dynamic content for players to interact with.

## Mission Types

The system supports various mission types:

- **Combat**: Military engagements and defensive operations
- **Escort**: Protecting vulnerable ships during transit
- **Trade**: Commercial operations between locations
- **Mining**: Resource extraction operations
- **Exploration**: Surveying and discovery missions
- **Rescue**: Emergency response and evacuation
- **Delivery**: Transport of specific cargo
- **Patrol**: Security and monitoring of regions

Each mission type has different parameters, behaviors, and completion criteria.

## Mission Structure

A mission consists of:

- **ID**: Unique identifier
- **Type**: The mission category
- **Name**: Human-readable name
- **Description**: Detailed mission brief
- **Status**: Current state (active, completed, failed)
- **Objectives**: Specific goals to accomplish
- **Location**: Primary mission location
- **Reward**: Value granted upon completion
- **Expiry Time**: When the mission will expire if not completed
- **Assigned Fleet**: The NPC fleet assigned to the mission

## Mission Generation

Missions are generated through several mechanisms:

### Procedural Generation

The system procedurally generates missions based on:

- The current state of the game world
- Available NPC fleets
- Celestial body positions
- Resource distribution
- Player activity

### Name Generation

Mission names combine elements from predefined pools:

```typescript
// Example name generation
private generateRandomName(): string {
  const prefixes = [
    "Operation", "Mission", "Task", "Project", "Directive"
  ];
  
  const attributes = [
    "Swift", "Valiant", "Phantom", "Solar", "Cosmic", 
    "Nebula", "Stellar", "Lunar", "Astral", "Nova",
    "Quantum", "Crimson", "Eclipse", "Void", "Radiant"
  ];
  
  const suffixes = [
    "Shield", "Vanguard", "Sentinel", "Dawn", "Guardian",
    "Oracle", "Falcon", "Titan", "Nomad", "Pioneer",
    "Pathfinder", "Voyager", "Harbinger", "Envoy", "Warden"
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const attribute = attributes[Math.floor(Math.random() * attributes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix} ${attribute} ${suffix}`;
}
```

### Type Selection

Mission types are selected based on weighted probabilities that can be adjusted:

```typescript
private selectRandomMissionType(): MissionType {
  const types: MissionType[] = Object.keys(this.missionTypeProbabilities) as MissionType[];
  const probabilities = types.map(type => this.missionTypeProbabilities[type]);
  const total = probabilities.reduce((sum, prob) => sum + prob, 0);
  
  let randomValue = Math.random() * total;
  for (let i = 0; i < types.length; i++) {
    randomValue -= probabilities[i];
    if (randomValue <= 0) {
      return types[i];
    }
  }
  
  return "combat"; // Fallback
}
```

## Mission Lifecycle

Missions follow a lifecycle:

1. **Generation**: Created with initial parameters
2. **Assignment**: Assigned to an appropriate NPC fleet
3. **Activation**: Fleet begins executing mission objectives
4. **Updates**: Progress is tracked and updated
5. **Completion/Failure**: Mission concludes with success or failure
6. **Cleanup**: Resources are released and new missions may be generated

## Fleet Assignment

Missions are assigned to appropriate NPC fleets based on:

- Fleet type matching mission requirements
- Fleet availability
- Proximity to mission location
- Fleet capabilities

```typescript
private assignFleetToMission(mission: Mission): void {
  // Find appropriate fleets based on mission type
  let candidateFleets: NpcFleet[] = [];
  
  switch (mission.type) {
    case "combat":
      candidateFleets = this.npcManager.getAllFleets().filter(f => 
        f.type === "enemy" && !f.assignedMissionId
      );
      break;
    case "trade":
    case "delivery":
      candidateFleets = this.npcManager.getAllFleets().filter(f => 
        f.type === "transport" && !f.assignedMissionId
      );
      break;
    // Other mission types...
  }
  
  if (candidateFleets.length === 0) {
    return; // No suitable fleets available
  }
  
  // Select the most appropriate fleet
  // For this example, just use the first available one
  const selectedFleet = candidateFleets[0];
  
  // Assign the mission
  selectedFleet.assignedMissionId = mission.id;
  mission.assignedFleetId = selectedFleet.id;
  
  console.log(`Assigned ${selectedFleet.type} fleet ${selectedFleet.id} to mission ${mission.id}`);
  
  // Update fleet behavior based on mission
  this.updateFleetBehaviorForMission(selectedFleet, mission);
}
```

## Mission Progress Tracking

Mission progress is tracked based on mission-specific criteria:

- **Combat**: Engagement completion and survival
- **Trade**: Successful transactions at destinations
- **Mining**: Resource collection thresholds
- **Escort**: Protected ship's survival to destination
- **Exploration**: Visitation of key locations

Progress updates occur during the server's update cycle:

```typescript
private updateMissionProgress(mission: Mission): void {
  // Bail if the mission is no longer active
  if (mission.status !== "active") return;
  
  // Get the assigned fleet
  const fleet = mission.assignedFleetId 
    ? this.npcManager.getFleet(mission.assignedFleetId) 
    : null;
    
  if (!fleet) {
    // Fleet was destroyed or unassigned
    this.failMission(mission.id, "Fleet lost");
    return;
  }
  
  // Update based on mission type
  switch (mission.type) {
    case "combat":
      this.updateCombatMission(mission, fleet);
      break;
    case "trade":
      this.updateTradeMission(mission, fleet);
      break;
    // Other mission types...
  }
  
  // Check for expiry
  const currentTime = Date.now();
  if (currentTime > mission.expiryTime) {
    this.failMission(mission.id, "Mission expired");
  }
}
```

## Fleet Behavior Control

The mission system guides fleet behavior based on active missions:

```typescript
private updateFleetBehaviorForMission(fleet: NpcFleet, mission: Mission): void {
  const fleetShips = this.npcManager.getNPCsByFleet(fleet.id);
  if (!fleetShips.length) return;
  
  // Set leader waypoints based on mission type
  const leaderNPC = fleetShips.find(npc => npc.id === fleet.leaderId);
  if (!leaderNPC) return;
  
  switch (mission.type) {
    case "patrol":
      // Set patrol waypoints around mission area
      const waypoints = this.generatePatrolWaypoints(mission.location, 5000);
      this.npcManager.setWaypoints(leaderNPC.id, waypoints);
      break;
    
    case "trade":
      // Set waypoints to trading stations
      const source = this.findNearestStation(leaderNPC.position);
      const destination = this.findTradeDestination(source);
      const tradeWaypoints = [
        { position: source.position, radius: 500 },
        { position: destination.position, radius: 500 }
      ];
      this.npcManager.setWaypoints(leaderNPC.id, tradeWaypoints);
      break;
    
    // Other mission types...
  }
  
  // Set formation for the fleet
  this.npcManager.setFleetFormation(fleet.id, leaderNPC.id);
}
```

## Mission Completion

Missions can be completed successfully or failed:

```typescript
private completeMission(missionId: string): void {
  const mission = this.missions.get(missionId);
  if (!mission) return;
  
  mission.status = "completed";
  mission.completionTime = Date.now();
  
  // Move from active to completed
  this.activeMissions.delete(missionId);
  this.completedMissions.set(missionId, mission);
  
  // Unassign fleet
  if (mission.assignedFleetId) {
    const fleet = this.npcManager.getFleet(mission.assignedFleetId);
    if (fleet) {
      fleet.assignedMissionId = null;
    }
  }
  
  console.log(`Mission ${mission.id} (${mission.name}) completed!`);
  
  // Generate replacement mission
  this.generateRandomMission();
}

private failMission(missionId: string, reason: string): void {
  const mission = this.missions.get(missionId);
  if (!mission) return;
  
  mission.status = "failed";
  mission.failureReason = reason;
  mission.completionTime = Date.now();
  
  // Move from active to failed
  this.activeMissions.delete(missionId);
  this.failedMissions.set(missionId, mission);
  
  // Unassign fleet
  if (mission.assignedFleetId) {
    const fleet = this.npcManager.getFleet(mission.assignedFleetId);
    if (fleet) {
      fleet.assignedMissionId = null;
    }
  }
  
  console.log(`Mission ${mission.id} (${mission.name}) failed: ${reason}`);
  
  // Generate replacement mission
  this.generateRandomMission();
}
```

## Mission Parameters

Each mission type has configurable parameters:

### Expiry Times
```typescript
private missionExpiryTimes: Record<MissionType, number> = {
  combat: 30 * 60 * 1000,      // 30 minutes
  trade: 45 * 60 * 1000,       // 45 minutes
  mining: 60 * 60 * 1000,      // 60 minutes
  escort: 20 * 60 * 1000,      // 20 minutes
  exploration: 90 * 60 * 1000, // 90 minutes
  rescue: 15 * 60 * 1000,      // 15 minutes
  delivery: 40 * 60 * 1000,    // 40 minutes
  patrol: 50 * 60 * 1000       // 50 minutes
};
```

### Probabilities
```typescript
private missionTypeProbabilities: Record<MissionType, number> = {
  combat: 20,
  trade: 20,
  mining: 15,
  escort: 10,
  exploration: 10,
  rescue: 5,
  delivery: 15,
  patrol: 5
};
```

## Integration with Other Systems

### NPC Manager
The Mission Manager directs NPC behavior through the NPC Manager, assigning waypoints, formations, and objectives.

### Game State Manager
Mission status is part of the game state that can be synchronized to clients.

### Celestial Manager
Mission locations often reference celestial bodies, requiring coordination with the Celestial Manager.

## Admin Interface

The admin dashboard includes a Missions tab that allows:

- Viewing active, completed, and failed missions
- Creating custom missions
- Manually assigning missions to fleets
- Adjusting mission generation parameters

## Example: Mission Creation

```typescript
// Generate a combat mission
const combatMission: Mission = {
  id: generateUuid(),
  type: "combat",
  name: "Operation Swift Justice",
  description: "Eliminate hostile forces near Mars orbit",
  status: "active",
  objectives: ["Destroy all enemy ships"],
  location: {
    x: marsPosition.x + 5000,
    y: marsPosition.y,
    z: marsPosition.z + 2000
  },
  creationTime: Date.now(),
  expiryTime: Date.now() + (30 * 60 * 1000), // 30 minutes
  progressPercentage: 0,
  reward: 500,
  assignedFleetId: null,
  completionTime: null,
  failureReason: null
};

this.missions.set(combatMission.id, combatMission);
this.activeMissions.set(combatMission.id, combatMission);
this.assignFleetToMission(combatMission);
```

## Performance Considerations

The mission system is optimized for performance:

- Inactive missions are not processed during update cycles
- Mission-specific optimization for different mission types
- Mission density is controlled to ensure server performance
- Expiry times prevent abandoned missions from consuming resources

## Future Enhancements

The mission system is designed to be expandable with plans for:

- Player-assignable missions
- Faction-based mission systems
- Mission chains and storylines
- Dynamic difficulty scaling
- Player reputation influence on mission availability
- Interactive mission objectives

## Conclusion

The Mission System creates a living, dynamic universe by directing NPC activities and generating evolving content. It serves as the narrative engine for the game, creating emergent stories and events throughout the solar system.