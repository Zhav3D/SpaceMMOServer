# NPC System Documentation

This document provides a comprehensive overview of the NPC system in Orbital Nexus, explaining how NPC ships and fleets are managed, their AI behaviors, and how they interact with the game world.

## Overview

The NPC system is a core component of Orbital Nexus that brings the game world to life through AI-controlled ships and fleets. These NPCs perform various roles in the game universe, from combat patrols to trade and mining operations.

## NPC Components

### NPC Ships

Individual NPC ships are the basic unit of the NPC system. Each ship has:

- A unique ID
- A ship type (enemy, transport, civilian, mining)
- A status (hostile, en-route, passive, working)
- Physical properties (position, velocity, rotation)
- Reference to a ship template
- AI state and behaviors

### NPC Fleets

Fleets are collections of NPC ships that operate together. Each fleet has:

- A unique fleet ID
- A type based on its primary function
- A leader ship
- Member ships
- Fleet-wide behaviors and missions

## Ship Types

### Enemy Ships
Combat vessels designed for patrol, interception, and attack missions. They have higher attack capabilities and are equipped with weapons systems.

### Transport Ships
Cargo vessels that move resources and goods between locations. They have higher cargo capacity but lower combat capabilities.

### Civilian Ships
General-purpose vessels for transportation and exploration. They have balanced capabilities and tend to follow established routes.

### Mining Ships
Specialized vessels designed for resource extraction. They have specialized equipment for mining operations and tend to operate near asteroids and resource-rich areas.

## AI States

NPCs transition between different AI states based on their current situation, objectives, and environmental factors.

### Primary AI States

- **IDLE**: Default state when no specific action is required
- **PATROLLING**: Moving between designated patrol points
- **ATTACKING**: Actively engaging a target
- **FLEEING**: Attempting to escape from danger
- **MINING**: Extracting resources from asteroids
- **DOCKING**: Approaching and docking with a station
- **TRADING**: Conducting trade operations
- **ESCORTING**: Protecting another vessel

### Advanced Navigation States

- **WAYPOINT_FOLLOWING**: Following a series of predefined waypoints
- **FORMATION_KEEPING**: Maintaining position relative to other ships
- **OBSTACLE_AVOIDANCE**: Actively avoiding obstacles

### Avoidance States

- **NONE**: No avoidance action necessary
- **ACTIVE**: Currently performing avoidance maneuvers
- **RECOVERING**: Returning to normal path after avoidance

## NPC Behaviors

### Navigation

NPCs navigate the game world using several methods:

1. **Waypoint Navigation**: Following a sequence of waypoints to reach destinations
2. **Formation Flying**: Maintaining relative positions in fleet formations
3. **Obstacle Avoidance**: Detecting and avoiding collisions with obstacles
4. **Target Pursuit**: Pursuing and intercepting target vessels

### Decision Making

NPCs make decisions based on:

1. **Current AI State**: Their present activity and objectives
2. **Environmental Factors**: Nearby objects, threats, and opportunities
3. **Mission Parameters**: Specific goals assigned to them
4. **Ship Capabilities**: What they're capable of based on their template

### State Transitions

NPCs transition between states based on predefined conditions:

- **IDLE → PATROLLING**: When assigned patrol waypoints
- **PATROLLING → ATTACKING**: When detecting a hostile target within range
- **ATTACKING → FLEEING**: When health drops below flee threshold
- **IDLE → MINING**: When near a minable asteroid
- **Any → OBSTACLE_AVOIDANCE**: When an obstacle is detected in path

## NPC Parameters

NPC behavior is governed by parameters defined in ship templates:

### Movement Parameters
- **maxSpeed**: Maximum velocity (m/s)
- **turnRate**: Turning speed (rad/s)
- **maxAcceleration**: Maximum acceleration (m/s²)

### Detection Parameters
- **detectionRange**: Maximum detection distance (m)
- **signatureRadius**: How visible the ship is to others (m)

### Combat Parameters
- **attackRange**: Maximum attack distance (m)
- **fleeThreshold**: Health percentage at which to flee

### Navigation Parameters
- **waypointArrivalDistance**: How close to get to waypoints (m)
- **pathfindingUpdateInterval**: How often to recalculate paths (ms)
- **obstacleAvoidanceDistance**: When to start avoiding obstacles (m)
- **formationKeepingTolerance**: Formation position accuracy (m)

## Integration with Other Systems

### Mission System
NPCs are assigned missions by the mission system. These missions determine their objectives, waypoints, and behavior patterns.

### Area of Interest System
NPCs are managed within the AOI system to ensure efficient state replication to clients. Only NPCs in relevant areas are synchronized to players.

### Celestial System
NPCs interact with celestial bodies, navigating around planets, mining asteroids, and docking at space stations.

## Creating and Managing NPCs

### Creation
NPCs are created through the NPCManager using:
- `createNPC()`: Creates individual ships
- `createNPCFleet()`: Creates a fleet with multiple ships

### Management
NPCs are managed using:
- `registerNPC()`: Adds a ship to the system
- `registerFleet()`: Adds a fleet to the system
- `removeNPC()`: Removes a ship from the system
- `removeFleet()`: Removes a fleet from the system

### Integration with Templates
NPCs use ship templates to define their characteristics and behaviors:
- `registerShipTemplate()`: Registers a template for use
- `getBestTemplateForType()`: Selects an appropriate template for a ship type

## NPC Update Cycle

The NPC system updates on each server tick:

1. Update NPC positions and rotations based on physics
2. Check for state transitions and update AI states
3. Process navigation and pathfinding
4. Handle interactions with other entities
5. Broadcast state updates to relevant clients

## Performance Considerations

The NPC system is optimized for performance:

- NPCs use simplified physics compared to players
- Updates are prioritized based on proximity to players
- Distant NPCs update less frequently
- AOI management ensures only relevant NPCs are synchronized

## Example: Fleet Creation

```typescript
// Create a mining fleet near an asteroid
const position = { x: 5000, y: 0, z: 12000 };
const { fleet, ships } = await npcManager.createNPCFleet(
  'mining',
  position,
  12, // Number of ships
  'Asteroid Belt Mining'
);

// Assign waypoints to the fleet leader
const waypoints = [
  { position: { x: 5200, y: 100, z: 12100 }, radius: 100 },
  { position: { x: 5500, y: -50, z: 12300 }, radius: 100 },
  { position: { x: 5100, y: 200, z: 12500 }, radius: 100 },
];
npcManager.setWaypoints(fleet.leaderId, waypoints);

// Set the fleet in formation
npcManager.setFleetFormation(fleet.id, fleet.leaderId);
```

## Debugging NPCs

For debugging purposes, NPCs provide:
- State visualization (e.g., color coding based on AI state)
- Waypoint visualization
- Debug logging of state transitions
- Performance metrics

## Future Enhancements

The NPC system is designed to be expandable with plans for:
- More sophisticated AI behaviors
- Learning and adaptation
- Faction relationships and diplomacy
- Advanced combat tactics
- Specialized role-based behaviors

## Conclusion

The NPC system is a crucial component of Orbital Nexus that creates a living, dynamic universe. Through diverse ship types, AI states, and behaviors, NPCs provide challenges, opportunities, and a sense of a populated game world.