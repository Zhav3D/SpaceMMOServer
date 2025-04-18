# Area of Interest System

This document explains the Area of Interest (AOI) system used in Orbital Nexus for efficient state replication in a space environment.

## Overview

The Area of Interest (AOI) system is a critical component that allows Orbital Nexus to support thousands of concurrent players in a vast space environment. It determines which entities (players, NPCs, objects) should be synchronized to each client based on relevance and proximity.

## Fundamental Concept

In a massive multiplayer game spanning solar-system distances, it's inefficient and unnecessary to synchronize every entity to every client. The AOI system divides the game world into logical regions and implements relevance filtering to ensure clients only receive updates about entities that matter to them.

## Key Components

### Areas of Interest

An Area of Interest is a defined region of space with the following properties:

- **ID**: Unique identifier
- **Name**: Human-readable label
- **Center Position**: Vector3 coordinates of the area's center
- **Radius**: The area's spherical radius
- **Entity Lists**: Collections of players and NPCs in the area
- **Statistics**: Performance metrics about the area

### Grid System

The space environment is divided into a sparse 3D grid where:

- Each grid cell maps to a specific area of interest
- Entities are assigned to grid cells based on their position
- The grid provides efficient spatial lookups

### Entity Tracking

The AOI system tracks:

- Which area each entity belongs to
- When entities move between areas
- Which entities are relevant to each client

## Technical Implementation

### Registration and Updates

- **Entity Registration**: When entities spawn, they're registered with the AOI system
- **Position Updates**: As entities move, their positions are updated in the AOI system
- **Area Changes**: When entities cross area boundaries, they're unregistered from the old area and registered with the new one

### Area Management

Areas can be:
- **Created**: New areas can be defined as needed
- **Removed**: Unused areas can be deleted
- **Updated**: Area properties can be modified
- **Queried**: Find which area contains a specific position

## Algorithm

The core algorithm works as follows:

1. **Grid Cell Mapping**:
   ```
   function getGridCell(position: Vector3): string {
     const cellX = Math.floor(position.x / gridCellSize);
     const cellY = Math.floor(position.y / gridCellSize);
     const cellZ = Math.floor(position.z / gridCellSize);
     return `${cellX},${cellY},${cellZ}`;
   }
   ```

2. **Entity Registration**:
   ```
   function registerEntity(entity, position) {
     const gridCell = getGridCell(position);
     const area = findAreaForCell(gridCell);
     area.addEntity(entity);
     entityAreaMap.set(entity.id, area.id);
   }
   ```

3. **Position Updates**:
   ```
   function updateEntityPosition(entity, newPosition) {
     const newGridCell = getGridCell(newPosition);
     const oldArea = getEntityArea(entity.id);
     const newArea = findAreaForCell(newGridCell);
     
     if (oldArea !== newArea) {
       oldArea.removeEntity(entity);
       newArea.addEntity(entity);
       entityAreaMap.set(entity.id, newArea.id);
     }
   }
   ```

4. **Relevance Determination**:
   ```
   function getRelevantEntities(client) {
     const clientArea = getEntityArea(client.id);
     return getAllEntitiesInArea(clientArea.id);
   }
   ```

## Special Cases

### Celestial Bodies

Celestial bodies (planets, moons, etc.) are considered "always relevant" and are synchronized to all clients regardless of their location. This ensures a consistent view of the solar system.

### Large-Scale Events

Some events (like major battles or announcements) may be broadcast to all clients regardless of AOI.

### Cross-Area Visibility

For entities near area boundaries, a buffer zone ensures they're included in multiple areas to prevent sudden appearance/disappearance.

## Dynamic Area Creation

The system can dynamically create areas based on:

- **Player Density**: Creating more areas in crowded regions
- **Activity Levels**: Creating areas around significant activity
- **Special Locations**: Creating areas around important locations

## Performance Optimization

The AOI system includes several optimizations:

- **Spatial Hashing**: For efficient position-to-area lookups
- **Hierarchical Areas**: Larger, less detailed areas for distant regions
- **Update Prioritization**: More frequent updates for closer entities
- **Temporal Coherence**: Exploiting frame-to-frame consistency

## Integration with Other Systems

### Game State Manager
The AOI system informs the Game State Manager which entities to include in state updates to each client.

### NPC Manager
NPCs register with the AOI system and update their positions, allowing the system to track which NPCs are relevant to which clients.

### Network Layer
The AOI determines which state updates are sent to each client over the network.

## Visualization and Debugging

The admin dashboard includes AOI visualization tools:

- **Map View**: Shows area boundaries and entity distribution
- **Statistics**: Displays entity counts per area
- **Performance Metrics**: Shows synchronization load per area

## Example: Default Areas

By default, the system initializes with areas around key locations:

- Earth Orbit
- Mars Orbit
- Asteroid Belt
- Outer Planets Region

## Code Example: Finding Relevant Entities

```typescript
export function getRelevantEntities(
  entityId: string,
  maxDistance: number = Infinity,
  includeTypes: ('player' | 'npc')[] = ['player', 'npc']
): AOIEntity[] {
  // Get the area that contains this entity
  const area = this.getEntityArea(entityId);
  if (!area) return [];
  
  // Get the entity itself
  const entity = [...area.players, ...area.npcs].find(e => e.id === entityId);
  if (!entity) return [];
  
  // Get all entities in the area
  const allEntities: AOIEntity[] = [];
  
  if (includeTypes.includes('player')) {
    allEntities.push(...area.players);
  }
  
  if (includeTypes.includes('npc')) {
    allEntities.push(...area.npcs);
  }
  
  // Filter by distance if needed
  if (maxDistance < Infinity) {
    return allEntities.filter(e => {
      if (e.id === entityId) return false; // Skip self
      
      const distance = calculateDistance(entity.position, e.position);
      return distance <= maxDistance;
    });
  }
  
  // Return all entities except self
  return allEntities.filter(e => e.id !== entityId);
}
```

## Conclusion

The Area of Interest system is a fundamental architecture component that enables Orbital Nexus to scale efficiently. By intelligently filtering which entities are synchronized to each client, it reduces bandwidth requirements and computational load while maintaining a seamless player experience.

## See Also

- [Network Protocol](UDP_PROTOCOL.md) - How entity state is transmitted over the network
- [Game State Management](GAME_STATE.md) - How game state is managed and validated
- [Performance Optimization](PERFORMANCE.md) - Additional performance techniques used in Orbital Nexus