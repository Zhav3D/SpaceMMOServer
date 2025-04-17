import { Vector3 } from '@shared/math';
import { AreaOfInterest, AreaOfInterestState } from '@shared/types';
import { Player } from '@shared/schema';

// Grid cell for spatial partitioning
interface GridCell {
  x: number;
  y: number;
  z: number;
  areaId: string;
}

// Entity types that can be in an area of interest
export type AOIEntity = {
  id: string;
  position: Vector3;
  type: 'player' | 'npc';
};

// Area of Interest Management
export class AOIManager {
  // Map of area IDs to area information
  private areas: Map<string, AreaOfInterest> = new Map();
  
  // Map from entity ID to area ID
  private entityAreaMap: Map<string, string> = new Map();
  
  // Spatial grid for faster lookups
  private grid: Map<string, GridCell> = new Map();
  private gridCellSize: number;
  
  constructor(gridCellSize: number = 1000.0) {
    this.gridCellSize = gridCellSize;
  }
  
  // Create a new area of interest
  createArea(
    id: string,
    name: string,
    center: Vector3,
    radius: number,
    capacityLimit: number = 400
  ): AreaOfInterest {
    const area: AreaOfInterest = {
      id,
      name,
      center,
      radius,
      playerCount: 0,
      npcCount: 0,
      load: 0,
      latency: 0,
      capacityLimit
    };
    
    this.areas.set(id, area);
    
    // Register area in grid cells it overlaps
    this.registerAreaInGrid(area);
    
    return area;
  }
  
  // Register an area in the spatial grid
  private registerAreaInGrid(area: AreaOfInterest): void {
    const centerX = Math.floor(area.center.x / this.gridCellSize);
    const centerY = Math.floor(area.center.y / this.gridCellSize);
    const centerZ = Math.floor(area.center.z / this.gridCellSize);
    
    // Calculate cell range based on radius
    const radiusCells = Math.ceil(area.radius / this.gridCellSize);
    
    // Register area in all cells it overlaps
    for (let x = centerX - radiusCells; x <= centerX + radiusCells; x++) {
      for (let y = centerY - radiusCells; y <= centerY + radiusCells; y++) {
        for (let z = centerZ - radiusCells; z <= centerZ + radiusCells; z++) {
          // Check if the cell is actually within the area radius
          const cellCenter = new Vector3(
            (x + 0.5) * this.gridCellSize,
            (y + 0.5) * this.gridCellSize,
            (z + 0.5) * this.gridCellSize
          );
          
          if (cellCenter.distance(area.center) <= area.radius + this.gridCellSize * 0.866) {
            const cellKey = `${x},${y},${z}`;
            this.grid.set(cellKey, { x, y, z, areaId: area.id });
          }
        }
      }
    }
  }
  
  // Get all registered areas
  getAllAreas(): AreaOfInterest[] {
    return Array.from(this.areas.values());
  }
  
  // Get area by ID
  getArea(areaId: string): AreaOfInterest | undefined {
    return this.areas.get(areaId);
  }
  
  // Update area statistics
  updateAreaStats(
    areaId: string,
    playerCount: number,
    npcCount: number,
    load: number,
    latency: number
  ): void {
    const area = this.areas.get(areaId);
    if (area) {
      area.playerCount = playerCount;
      area.npcCount = npcCount;
      area.load = load;
      area.latency = latency;
    }
  }
  
  // Find the area containing a position
  findAreaAtPosition(position: Vector3): AreaOfInterest | undefined {
    // First check grid for faster lookup
    const cellX = Math.floor(position.x / this.gridCellSize);
    const cellY = Math.floor(position.y / this.gridCellSize);
    const cellZ = Math.floor(position.z / this.gridCellSize);
    
    const cellKey = `${cellX},${cellY},${cellZ}`;
    const cell = this.grid.get(cellKey);
    
    if (cell) {
      const area = this.areas.get(cell.areaId);
      
      // Verify position is actually within area radius
      if (area && position.distance(area.center) <= area.radius) {
        return area;
      }
    }
    
    // Fall back to checking all areas if grid lookup didn't find a match
    for (const area of this.areas.values()) {
      if (position.distance(area.center) <= area.radius) {
        return area;
      }
    }
    
    return undefined;
  }
  
  // Register an entity in an area
  registerEntity(entityId: string, position: Vector3, type: 'player' | 'npc'): string | undefined {
    // Find area containing the position
    const area = this.findAreaAtPosition(position);
    
    if (area) {
      // Update entity-area mapping
      this.entityAreaMap.set(entityId, area.id);
      
      // Update area counts
      if (type === 'player') {
        area.playerCount += 1;
      } else {
        area.npcCount += 1;
      }
      
      return area.id;
    }
    
    return undefined;
  }
  
  // Update entity position and area if needed
  updateEntityPosition(entityId: string, position: Vector3, type: 'player' | 'npc'): string | undefined {
    const currentAreaId = this.entityAreaMap.get(entityId);
    
    // Find new area containing the position
    const newArea = this.findAreaAtPosition(position);
    
    if (!newArea) {
      // No area contains this position
      if (currentAreaId) {
        // Entity left all areas, remove it
        this.removeEntity(entityId, type);
      }
      return undefined;
    }
    
    if (currentAreaId !== newArea.id) {
      // Entity moved to a new area
      
      // Remove from old area
      if (currentAreaId) {
        const oldArea = this.areas.get(currentAreaId);
        if (oldArea) {
          if (type === 'player') {
            oldArea.playerCount = Math.max(0, oldArea.playerCount - 1);
          } else {
            oldArea.npcCount = Math.max(0, oldArea.npcCount - 1);
          }
        }
      }
      
      // Add to new area
      this.entityAreaMap.set(entityId, newArea.id);
      if (type === 'player') {
        newArea.playerCount += 1;
      } else {
        newArea.npcCount += 1;
      }
      
      return newArea.id;
    }
    
    return currentAreaId;
  }
  
  // Remove an entity from its area
  removeEntity(entityId: string, type: 'player' | 'npc'): void {
    const areaId = this.entityAreaMap.get(entityId);
    
    if (areaId) {
      const area = this.areas.get(areaId);
      
      if (area) {
        // Update area counts
        if (type === 'player') {
          area.playerCount = Math.max(0, area.playerCount - 1);
        } else {
          area.npcCount = Math.max(0, area.npcCount - 1);
        }
      }
      
      // Remove mapping
      this.entityAreaMap.delete(entityId);
    }
  }
  
  // Get the area an entity is in
  getEntityArea(entityId: string): AreaOfInterest | undefined {
    const areaId = this.entityAreaMap.get(entityId);
    
    if (areaId) {
      return this.areas.get(areaId);
    }
    
    return undefined;
  }
  
  // Get entities that should be replicated to a given entity
  getRelevantEntities(
    observerEntityId: string,
    allEntities: AOIEntity[]
  ): AOIEntity[] {
    const observerAreaId = this.entityAreaMap.get(observerEntityId);
    
    if (!observerAreaId) {
      return []; // Observer is not in any AOI
    }
    
    const observerArea = this.areas.get(observerAreaId);
    if (!observerArea) {
      return []; // Observer area no longer exists
    }
    
    // Get observer position (must be in allEntities)
    const observer = allEntities.find(e => e.id === observerEntityId);
    
    if (!observer) {
      return []; // Observer not found in entity list
    }
    
    return allEntities.filter(entity => {
      // Always include the observer itself
      if (entity.id === observerEntityId) {
        return true;
      }
      
      // Include entities in the same AOI
      const entityAreaId = this.entityAreaMap.get(entity.id);
      if (entityAreaId === observerAreaId) {
        return true;
      }
      
      // Include nearby entities even if they're in a different AOI
      const distance = entity.position.distance(observer.position);
      return distance <= observerArea.radius;
    });
  }
  
  // Convert internal AreaOfInterest to network-friendly AreaOfInterestState
  areaToState(area: AreaOfInterest): AreaOfInterestState {
    return {
      id: area.id,
      name: area.name,
      center: area.center,
      radius: area.radius,
      playerCount: area.playerCount,
      npcCount: area.npcCount,
      load: area.load,
      latency: area.latency
    };
  }
  
  // Get all areas as network states
  getAllAreaStates(): AreaOfInterestState[] {
    return this.getAllAreas().map(area => this.areaToState(area));
  }
}
