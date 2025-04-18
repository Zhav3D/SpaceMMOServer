import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Vector3 } from "@shared/math";
import { serverInstance, GameServer } from "./index";
import { log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  celestialBodies, 
  npcShips, 
  npcFleets, 
  areasOfInterest, 
  serverLogs, 
  serverStats, 
  missions,
  shipTemplates
} from "@shared/schema";

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Base API route
  app.get('/api/status', (req: Request, res: Response) => {
    const playerCount = serverInstance ? serverInstance.getPlayerCount() : 0;
    
    res.json({
      success: true,
      data: {
        status: 'online',
        version: '1.0.0',
        playerCount,
        maxPlayers: 2000,
        uptime: serverInstance ? serverInstance.getUptime() : 0,
      }
    });
  });
  
  // Celestial bodies API
  app.get('/api/celestial', async (req: Request, res: Response) => {
    try {
      const bodies = await storage.getAllCelestialBodies();
      
      // Get current positions if server instance is available
      let bodyData = bodies;
      
      if (serverInstance && serverInstance.celestialManager) {
        const positions = serverInstance.celestialManager.getCurrentPositions();
        const progress = serverInstance.celestialManager.calculateOrbitalProgress();
        
        bodyData = bodies.map(body => {
          const posVel = positions.get(body.id);
          
          if (posVel) {
            return {
              ...body,
              currentPositionX: posVel.position.x,
              currentPositionY: posVel.position.y,
              currentPositionZ: posVel.position.z,
              currentVelocityX: posVel.velocity.x,
              currentVelocityY: posVel.velocity.y,
              currentVelocityZ: posVel.velocity.z,
              orbitProgress: progress.get(body.id) || 0,
            };
          }
          
          return body;
        });
      }
      
      const response: ApiResponse<typeof bodyData> = {
        success: true,
        data: bodyData,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch celestial bodies: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Get single celestial body
  app.get('/api/celestial/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid celestial body ID',
        });
      }
      
      const body = await storage.getCelestialBody(id);
      if (!body) {
        return res.status(404).json({
          success: false,
          error: 'Celestial body not found',
        });
      }
      
      // Get current position if server instance is available
      let bodyData = body;
      
      if (serverInstance && serverInstance.celestialManager) {
        const positions = serverInstance.celestialManager.getCurrentPositions();
        const progress = serverInstance.celestialManager.calculateOrbitalProgress();
        const posVel = positions.get(body.id);
        
        if (posVel) {
          bodyData = {
            ...body,
            currentPositionX: posVel.position.x,
            currentPositionY: posVel.position.y,
            currentPositionZ: posVel.position.z,
            currentVelocityX: posVel.velocity.x,
            currentVelocityY: posVel.velocity.y,
            currentVelocityZ: posVel.velocity.z,
            orbitProgress: progress.get(body.id) || 0,
          };
        }
      }
      
      const response: ApiResponse<typeof bodyData> = {
        success: true,
        data: bodyData,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch celestial body: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Create new celestial body
  app.post('/api/celestial', async (req: Request, res: Response) => {
    try {
      if (!serverInstance || !serverInstance.celestialManager) {
        return res.status(500).json({
          success: false,
          error: 'Celestial manager not initialized',
        });
      }
      
      // Create new celestial body
      const newBody = req.body;
      
      // Basic validation
      if (!newBody.name || !newBody.type || newBody.radius === undefined || newBody.mass === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, type, radius, mass',
        });
      }
      
      // Create the body first in storage
      const createdBody = await storage.createCelestialBody(newBody);
      
      // Add to celestial manager
      const addedBody = await serverInstance.celestialManager.addBody(createdBody);
      
      const response: ApiResponse<typeof addedBody> = {
        success: true,
        data: addedBody,
      };
      
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to create celestial body: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Update celestial body
  app.put('/api/celestial/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid celestial body ID',
        });
      }
      
      if (!serverInstance || !serverInstance.celestialManager) {
        return res.status(500).json({
          success: false,
          error: 'Celestial manager not initialized',
        });
      }
      
      // Check if body exists
      const existingBody = await storage.getCelestialBody(id);
      if (!existingBody) {
        return res.status(404).json({
          success: false,
          error: 'Celestial body not found',
        });
      }
      
      // Update the body
      const updatedData = req.body;
      updatedData.id = id; // Ensure ID matches
      
      // Update in storage first
      const updatedBody = await storage.updateCelestialBody(id, updatedData);
      
      // Update in celestial manager (remove and add again with new data)
      await serverInstance.celestialManager.removeBody(id);
      const readdedBody = await serverInstance.celestialManager.addBody(updatedBody);
      
      const response: ApiResponse<typeof readdedBody> = {
        success: true,
        data: readdedBody,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update celestial body: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Delete celestial body
  app.delete('/api/celestial/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid celestial body ID',
        });
      }
      
      if (!serverInstance || !serverInstance.celestialManager) {
        return res.status(500).json({
          success: false,
          error: 'Celestial manager not initialized',
        });
      }
      
      // Check if body exists
      const existingBody = await storage.getCelestialBody(id);
      if (!existingBody) {
        return res.status(404).json({
          success: false,
          error: 'Celestial body not found',
        });
      }
      
      // Check if this body has children (bodies that have this body as parent)
      const allBodies = await storage.getAllCelestialBodies();
      const hasChildren = allBodies.some(body => body.parentBodyId === id);
      
      if (hasChildren) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete a celestial body that has other bodies orbiting it. Please reassign or delete the dependent bodies first.',
        });
      }
      
      // Remove from celestial manager first
      await serverInstance.celestialManager.removeBody(id);
      
      // Remove from storage
      await storage.deleteCelestialBody(id);
      
      const response: ApiResponse<{ id: number, message: string }> = {
        success: true,
        data: {
          id,
          message: 'Celestial body deleted successfully',
        },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to delete celestial body: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Get celestial simulation settings
  app.get('/api/celestial/settings', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.celestialManager) {
      return res.status(500).json({
        success: false,
        error: 'Celestial manager not initialized',
      });
    }
    
    try {
      const settings = serverInstance.celestialManager.getSimulationSettings();
      
      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to get celestial simulation settings: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Get simulation speed as a separate endpoint for convenience
  app.get('/api/celestial/simulation/speed', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (!serverInstance || !serverInstance.celestialManager) {
      return res.status(500).json({
        success: false,
        error: 'Celestial manager not initialized',
      });
    }
    
    try {
      const settings = serverInstance.celestialManager.getSimulationSettings();
      
      const response: ApiResponse<{ simulationSpeed: number }> = {
        success: true,
        data: { simulationSpeed: settings.simulationSpeed },
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error getting simulation speed:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to get simulation speed: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // NPC fleets API
  app.get('/api/npc/fleets', async (req: Request, res: Response) => {
    try {
      const fleets = await storage.getAllNpcFleets();
      
      const response: ApiResponse<typeof fleets> = {
        success: true,
        data: fleets,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch NPC fleets: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Create NPC fleet API
  app.post('/api/npc/fleets', async (req: Request, res: Response) => {
    try {
      const { type, count, location, nearestCelestialBodyId } = req.body;
      
      if (!type || !count || !location || !nearestCelestialBodyId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters',
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized',
        });
      }
      
      // Create the fleet
      const fleetResult = serverInstance.npcManager.createNPCFleet(
        type,
        parseInt(count, 10),
        location,
        parseInt(nearestCelestialBodyId, 10)
      );
      
      // Save to storage
      const fleet = await storage.createNpcFleet(fleetResult.fleet);
      
      // Create and save all ships
      const savedShips = [];
      for (const ship of fleetResult.ships) {
        const savedShip = await storage.createNpcShip(ship);
        savedShips.push(savedShip);
        serverInstance.npcManager.registerNPC(savedShip);
      }
      
      // Register the fleet
      serverInstance.npcManager.registerFleet(fleet);
      
      const response: ApiResponse<{ fleet: typeof fleet, ships: typeof savedShips }> = {
        success: true,
        data: {
          fleet,
          ships: savedShips,
        },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to create NPC fleet: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Delete NPC fleet API
  app.delete('/api/npc/fleets/:fleetId', async (req: Request, res: Response) => {
    try {
      const { fleetId } = req.params;
      
      if (!fleetId) {
        return res.status(400).json({
          success: false,
          error: 'Missing fleet ID',
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized',
        });
      }
      
      // Find the fleet by fleetId
      const fleet = await storage.getNpcFleetByFleetId(fleetId);
      
      if (!fleet) {
        return res.status(404).json({
          success: false,
          error: `Fleet with ID ${fleetId} not found`,
        });
      }
      
      // Get all ships in this fleet
      const ships = await storage.getNpcShipsByFleet(fleetId);
      
      // Delete all ships from storage
      for (const ship of ships) {
        await storage.deleteNpcShip(ship.id);
      }
      
      // Delete the fleet from storage
      await storage.deleteNpcFleet(fleet.id);
      
      // Remove the fleet and its ships from the NPC manager
      serverInstance.npcManager.removeFleet(fleetId);
      
      const response: ApiResponse<{ message: string, fleetId: string }> = {
        success: true,
        data: {
          message: `Fleet with ID ${fleetId} and all its ships have been deleted`,
          fleetId
        },
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to delete NPC fleet: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Advanced NPC navigation endpoints
  
  // Get all ships in a fleet (will be used for selecting ships for navigation)
  app.get('/api/npc/fleet/:fleetId/ships', async (req: Request, res: Response) => {
    try {
      const { fleetId } = req.params;
      
      if (!fleetId) {
        return res.status(400).json({
          success: false,
          error: 'Missing fleet ID'
        });
      }
      
      // Get ships from storage
      const ships = await storage.getNpcShipsByFleet(fleetId);
      
      if (!ships || ships.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No ships found for fleet ID ${fleetId}`
        });
      }
      
      res.json({
        success: true,
        data: ships
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get fleet ships: ${error}`
      });
    }
  });
  
  // Set waypoints for a specific NPC ship
  app.post('/api/npc/ship/:npcId/waypoints', async (req: Request, res: Response) => {
    try {
      const npcId = parseInt(req.params.npcId, 10);
      const waypoints = req.body.waypoints;
      
      if (isNaN(npcId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NPC ID'
        });
      }
      
      if (!Array.isArray(waypoints) || waypoints.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid waypoints format or empty waypoints array'
        });
      }
      
      // Validate waypoint format
      for (const waypoint of waypoints) {
        if (!waypoint.position || 
            typeof waypoint.position.x !== 'number' ||
            typeof waypoint.position.y !== 'number' ||
            typeof waypoint.position.z !== 'number' ||
            typeof waypoint.radius !== 'number') {
          return res.status(400).json({
            success: false,
            error: 'Invalid waypoint format. Each waypoint must have position (x,y,z) and radius.'
          });
        }
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized'
        });
      }
      
      // Convert waypoint positions to Vector3 objects
      const formattedWaypoints = waypoints.map(wp => ({
        position: new Vector3(wp.position.x, wp.position.y, wp.position.z),
        radius: wp.radius,
        maxSpeed: wp.maxSpeed,
        waitTime: wp.waitTime,
        isOptional: wp.isOptional
      }));
      
      const success = serverInstance.npcManager.setWaypoints(npcId, formattedWaypoints);
      
      if (success) {
        // Update the NPC in storage to reflect its new navigation state
        const npc = await storage.getNpcShip(npcId);
        if (npc) {
          npc.navigationState = 'waypoint';
          npc.aiState = 'waypoint_following';
          npc.waypointsJson = JSON.stringify(waypoints);
          await storage.updateNpcShip(npcId, npc);
        }
        
        res.json({
          success: true,
          data: {
            message: 'Waypoints set successfully',
            npcId,
            waypointCount: formattedWaypoints.length
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'NPC not found or waypoints could not be set'
        });
      }
    } catch (error) {
      console.error('Error setting waypoints:', error);
      res.status(500).json({
        success: false,
        error: `Failed to set waypoints: ${error}`
      });
    }
  });
  
  // Get waypoints for a specific NPC
  app.get('/api/npc/ship/:npcId/waypoints', async (req: Request, res: Response) => {
    try {
      const npcId = parseInt(req.params.npcId, 10);
      
      if (isNaN(npcId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NPC ID'
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized'
        });
      }
      
      const waypoints = serverInstance.npcManager.getWaypoints(npcId);
      
      if (waypoints) {
        // Format waypoints for API response
        const formattedWaypoints = waypoints.map(wp => ({
          position: {
            x: wp.position.x,
            y: wp.position.y,
            z: wp.position.z
          },
          radius: wp.radius,
          maxSpeed: wp.maxSpeed,
          waitTime: wp.waitTime,
          isOptional: wp.isOptional
        }));
        
        res.json({
          success: true,
          data: {
            npcId,
            waypoints: formattedWaypoints,
            navigationState: 'waypoint'
          }
        });
      } else {
        // Still return success but with empty array
        res.json({
          success: true,
          data: {
            npcId,
            waypoints: [],
            navigationState: 'none'
          }
        });
      }
    } catch (error) {
      console.error('Error getting waypoints:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get waypoints: ${error}`
      });
    }
  });
  
  // Clear waypoints for a specific NPC
  app.delete('/api/npc/ship/:npcId/waypoints', async (req: Request, res: Response) => {
    try {
      const npcId = parseInt(req.params.npcId, 10);
      
      if (isNaN(npcId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NPC ID'
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized'
        });
      }
      
      // Clear waypoints by setting an empty array
      const success = serverInstance.npcManager.setWaypoints(npcId, []);
      
      if (success) {
        // Update the NPC in storage
        const npc = await storage.getNpcShip(npcId);
        if (npc) {
          npc.navigationState = 'none';
          npc.aiState = 'patrolling'; // Reset to default behavior
          npc.waypointsJson = null;
          await storage.updateNpcShip(npcId, npc);
        }
        
        res.json({
          success: true,
          data: {
            message: 'Waypoints cleared successfully',
            npcId
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'NPC not found'
        });
      }
    } catch (error) {
      console.error('Error clearing waypoints:', error);
      res.status(500).json({
        success: false,
        error: `Failed to clear waypoints: ${error}`
      });
    }
  });
  
  // Set fleet formation with a leader
  app.post('/api/npc/fleet/:fleetId/formation', async (req: Request, res: Response) => {
    try {
      const { fleetId } = req.params;
      const { leaderNpcId } = req.body;
      
      if (!fleetId) {
        return res.status(400).json({
          success: false,
          error: 'Missing fleet ID'
        });
      }
      
      const npcId = parseInt(leaderNpcId, 10);
      if (isNaN(npcId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid leader NPC ID'
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized'
        });
      }
      
      const success = serverInstance.npcManager.setFleetFormation(fleetId, npcId);
      
      if (success) {
        // Update all fleet NPCs in storage with their new navigation states
        const ships = await storage.getNpcShipsByFleet(fleetId);
        for (const ship of ships) {
          if (ship.id === npcId) {
            // Leader
            ship.navigationState = 'formation';
            ship.formationPosition = null;
          } else {
            // Followers
            ship.navigationState = 'formation';
            ship.aiState = 'formation_keeping';
          }
          await storage.updateNpcShip(ship.id, ship);
        }
        
        res.json({
          success: true,
          data: {
            message: 'Fleet formation set successfully',
            fleetId,
            leaderNpcId: npcId
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Fleet or leader NPC not found'
        });
      }
    } catch (error) {
      console.error('Error setting fleet formation:', error);
      res.status(500).json({
        success: false,
        error: `Failed to set fleet formation: ${error}`
      });
    }
  });
  
  // Clear fleet formation (reset to individual behavior)
  app.delete('/api/npc/fleet/:fleetId/formation', async (req: Request, res: Response) => {
    try {
      const { fleetId } = req.params;
      
      if (!fleetId) {
        return res.status(400).json({
          success: false,
          error: 'Missing fleet ID'
        });
      }
      
      if (!serverInstance || !serverInstance.npcManager) {
        return res.status(500).json({
          success: false,
          error: 'NPC manager not initialized'
        });
      }
      
      // Get all ships in the fleet
      const ships = await storage.getNpcShipsByFleet(fleetId);
      
      if (!ships || ships.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No ships found for fleet ID ${fleetId}`
        });
      }
      
      // Reset all ships to patrolling behavior
      let successCount = 0;
      for (const ship of ships) {
        if (ship.navigationState === 'formation') {
          ship.navigationState = 'none';
          ship.aiState = 'patrolling';
          ship.formationPosition = null;
          await storage.updateNpcShip(ship.id, ship);
          successCount++;
        }
      }
      
      res.json({
        success: true,
        data: {
          message: 'Fleet formation cleared successfully',
          fleetId,
          shipsUpdated: successCount
        }
      });
    } catch (error) {
      console.error('Error clearing fleet formation:', error);
      res.status(500).json({
        success: false,
        error: `Failed to clear fleet formation: ${error}`
      });
    }
  });
  
  // Players API
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      const players = await storage.getConnectedPlayers();
      
      const response: ApiResponse<typeof players> = {
        success: true,
        data: players,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch players: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Areas of interest API
  app.get('/api/aoi', async (req: Request, res: Response) => {
    try {
      const areas = await storage.getAllAreasOfInterest();
      
      // If server instance is available, get the current state
      if (serverInstance && serverInstance.aoiManager) {
        const areaStates = serverInstance.aoiManager.getAllAreaStates();
        
        // Map DB records to current states for additional data
        const enrichedAreas = areas.map(area => {
          const state = areaStates.find(s => s.id === `aoi-${area.id}`);
          
          if (state) {
            return {
              ...area,
              currentPlayerCount: state.playerCount,
              currentNpcCount: state.npcCount,
              currentLoad: state.load,
              currentLatency: state.latency,
            };
          }
          
          return area;
        });
        
        const response: ApiResponse<typeof enrichedAreas> = {
          success: true,
          data: enrichedAreas,
        };
        
        return res.json(response);
      }
      
      const response: ApiResponse<typeof areas> = {
        success: true,
        data: areas,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch areas of interest: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Server logs API
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      const level = req.query.level as string;
      
      const logs = await storage.getRecentLogs(limit, level);
      
      const response: ApiResponse<typeof logs> = {
        success: true,
        data: logs,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch logs: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Server stats API
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      
      const stats = await storage.getRecentStats(limit);
      
      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch stats: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Server settings API
  app.get('/api/settings', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    const settings = serverInstance.getSettings();
    
    const response: ApiResponse<typeof settings> = {
      success: true,
      data: settings,
    };
    
    res.json(response);
  });
  
  // Update server settings API
  app.put('/api/settings', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    try {
      const newSettings = req.body;
      
      // Update settings
      serverInstance.updateSettings(newSettings);
      
      const response: ApiResponse<typeof newSettings> = {
        success: true,
        data: newSettings,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update settings: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Set simulation speed API (updated)
  app.put('/api/celestial/simulation', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.celestialManager) {
      return res.status(500).json({
        success: false,
        error: 'Celestial manager not initialized',
      });
    }
    
    try {
      // Allow either 'speed' or 'simulationSpeed' in request body for flexibility
      const speed = req.body.speed !== undefined ? req.body.speed : req.body.simulationSpeed;
      
      if (speed === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing speed or simulationSpeed parameter',
        });
      }
      
      // Update simulation speed
      const numericSpeed = parseFloat(speed);
      serverInstance.celestialManager.setSimulationSpeed(numericSpeed);
      
      const response: ApiResponse<{ simulationSpeed: number }> = {
        success: true,
        data: { simulationSpeed: numericSpeed },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update simulation speed: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Dedicated endpoint for simulation speed updates
  app.put('/api/celestial/simulation/speed', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (!serverInstance || !serverInstance.celestialManager) {
      return res.status(500).json({
        success: false,
        error: 'Celestial manager not initialized',
      });
    }
    
    try {
      const speed = parseFloat(req.body.speed);
      
      if (isNaN(speed)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid speed parameter. Must be a number.',
        });
      }
      
      console.log(`Setting simulation speed to ${speed}`);
      serverInstance.celestialManager.setSimulationSpeed(speed);
      
      const response: ApiResponse<{ simulationSpeed: number }> = {
        success: true,
        data: { simulationSpeed: speed },
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error updating simulation speed:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update simulation speed: ${error}`,
      };
      
      return res.status(500).json(response);
    }
  });
  
  // For testing/debugging
  app.post('/api/celestial/simulation/test', (req: Request, res: Response) => {
    try {
      console.log("Test API hit with payload:", req.body);
      
      res.json({
        success: true,
        data: { received: req.body },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Test endpoint error: ${error}`,
      });
    }
  });
  
  // Emergency stop API
  app.post('/api/emergency-stop', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    try {
      // Start emergency shutdown
      serverInstance.emergencyStop();
      
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Emergency stop initiated' },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to initiate emergency stop: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // API to create simulated players
  app.post('/api/simulated-players', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    try {
      const { count, areaId } = req.body;
      
      if (!count || typeof count !== 'number' || count <= 0 || count > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid count. Must be a number between 1 and 1000.',
        });
      }
      
      // Create simulated players using the game state manager
      const simulatedPlayers = serverInstance.gameStateManager.createSimulatedPlayers(
        count,
        areaId
      );
      
      const response: ApiResponse<{
        message: string;
        count: number;
        totalPlayers: number;
      }> = {
        success: true,
        data: {
          message: `Created ${count} simulated players`,
          count: simulatedPlayers.length,
          totalPlayers: serverInstance.gameStateManager.getPlayerCount()
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to create simulated players: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // API to remove all simulated players
  app.delete('/api/simulated-players', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    try {
      // Remove all simulated players
      serverInstance.gameStateManager.removeAllSimulatedPlayers();
      
      const response: ApiResponse<{
        message: string;
        remainingPlayers: number;
      }> = {
        success: true,
        data: {
          message: 'All simulated players removed',
          remainingPlayers: serverInstance.gameStateManager.getRealPlayers().length
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to remove simulated players: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // API to get simulated player stats
  app.get('/api/simulated-players', (req: Request, res: Response) => {
    if (!serverInstance) {
      return res.status(500).json({
        success: false,
        error: 'Server not initialized',
      });
    }
    
    try {
      const response: ApiResponse<{
        count: number;
        totalPlayers: number;
        realPlayers: number;
      }> = {
        success: true,
        data: {
          count: serverInstance.gameStateManager.getSimulatedPlayerCount(),
          totalPlayers: serverInstance.gameStateManager.getPlayerCount(),
          realPlayers: serverInstance.gameStateManager.getRealPlayers().length
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch simulated player stats: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });

  // Missions API
  app.get('/api/missions', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.missionManager) {
      return res.status(503).json({
        success: false,
        error: 'Mission system not initialized'
      });
    }
    
    try {
      // Get mission data from mission manager
      const activeMissions = serverInstance.missionManager.getAllActiveMissions();
      const completedMissions = serverInstance.missionManager.getAllCompletedMissions();
      const failedMissions = serverInstance.missionManager.getAllFailedMissions();
      
      // Convert to mission state for transmission
      const activeStates = activeMissions.map(m => serverInstance.missionManager.missionToState(m));
      const completedStates = completedMissions.map(m => serverInstance.missionManager.missionToState(m));
      const failedStates = failedMissions.map(m => serverInstance.missionManager.missionToState(m));
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          active: activeStates,
          completed: completedStates,
          failed: failedStates
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch missions: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Get a specific mission
  app.get('/api/missions/:missionId', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.missionManager) {
      return res.status(503).json({
        success: false,
        error: 'Mission system not initialized'
      });
    }
    
    try {
      const { missionId } = req.params;
      
      if (!missionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing mission ID'
        });
      }
      
      const mission = serverInstance.missionManager.getMission(missionId);
      
      if (!mission) {
        return res.status(404).json({
          success: false,
          error: `Mission with ID ${missionId} not found`
        });
      }
      
      const missionState = serverInstance.missionManager.missionToState(mission);
      
      const response: ApiResponse<any> = {
        success: true,
        data: missionState
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch mission: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Delete a mission
  app.delete('/api/missions/:missionId', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.missionManager) {
      return res.status(503).json({
        success: false,
        error: 'Mission system not initialized'
      });
    }
    
    try {
      const { missionId } = req.params;
      
      if (!missionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing mission ID'
        });
      }
      
      const success = serverInstance.missionManager.deleteMission(missionId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: `Mission with ID ${missionId} not found or could not be deleted`
        });
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: `Mission with ID ${missionId} successfully deleted`,
          missionId
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to delete mission: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Assign a mission to a fleet
  app.put('/api/missions/:missionId/assign', (req: Request, res: Response) => {
    if (!serverInstance || !serverInstance.missionManager) {
      return res.status(503).json({
        success: false,
        error: 'Mission system not initialized'
      });
    }
    
    try {
      const { missionId } = req.params;
      const { fleetId } = req.body;
      
      if (!missionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing mission ID'
        });
      }
      
      if (!fleetId) {
        return res.status(400).json({
          success: false,
          error: 'Missing fleet ID in request body'
        });
      }
      
      const success = serverInstance.missionManager.assignMissionToFleet(missionId, fleetId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: `Could not assign mission ${missionId} to fleet ${fleetId}. Mission or fleet may not exist.`
        });
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: `Mission ${missionId} successfully assigned to fleet ${fleetId}`,
          missionId,
          fleetId
        }
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to assign mission: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Frozen solar system toggle API
  app.get('/api/celestial/frozen', (req: Request, res: Response) => {
    try {
      if (!serverInstance || !serverInstance.celestialManager) {
        return res.status(500).json({
          success: false,
          error: 'Celestial manager not initialized',
        });
      }
      
      const frozen = serverInstance.celestialManager.isFrozen();
      
      const response: ApiResponse<{ frozen: boolean }> = {
        success: true,
        data: { frozen },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to get frozen state: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  app.post('/api/celestial/frozen', async (req: Request, res: Response) => {
    try {
      if (!serverInstance || !serverInstance.celestialManager) {
        return res.status(500).json({
          success: false,
          error: 'Celestial manager not initialized',
        });
      }
      
      const { frozen } = req.body;
      
      if (typeof frozen !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body. Expected { frozen: boolean }',
        });
      }
      
      const result = await serverInstance.celestialManager.toggleFrozenMode(frozen);
      
      const response: ApiResponse<{ frozen: boolean }> = {
        success: true,
        data: { frozen: result },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to set frozen state: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // World persistence APIs
  app.post('/api/world/save', async (req: Request, res: Response) => {
    try {
      const result = await storage.saveWorldState();
      
      if (result) {
        const response: ApiResponse<{ message: string }> = {
          success: true,
          data: { message: 'World state saved successfully' },
        };
        
        res.json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to save world state',
        };
        
        res.status(500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to save world state: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  app.post('/api/world/load', async (req: Request, res: Response) => {
    try {
      const result = await storage.loadWorldState();
      
      if (result) {
        const response: ApiResponse<{ message: string }> = {
          success: true,
          data: { message: 'World state loaded successfully' },
        };
        
        res.json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to load world state',
        };
        
        res.status(500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to load world state: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  app.post('/api/world/reset', async (req: Request, res: Response) => {
    try {
      // First do a direct SQL query to clean up any lingering data
      try {
        await db.transaction(async (tx: any) => {
          // Delete all data from tables in proper order
          await tx.delete(npcShips);
          await tx.delete(npcFleets);
          await tx.delete(celestialBodies);
          await tx.delete(areasOfInterest);
          await tx.delete(serverLogs);
          await tx.delete(serverStats);
          
          // Reset all sequences to 1
          await tx.execute(sql`
            SELECT setval('"celestial_bodies_id_seq"', 1, false); 
            SELECT setval('"npc_ships_id_seq"', 1, false);
            SELECT setval('"npc_fleets_id_seq"', 1, false);
            SELECT setval('"areas_of_interest_id_seq"', 1, false);
            SELECT setval('"server_logs_id_seq"', 1, false);
            SELECT setval('"server_stats_id_seq"', 1, false);
            SELECT setval('"missions_id_seq"', 1, false);
          `);
        });
        log('Direct database reset completed successfully', 'info');
      } catch (dbError) {
        log(`Error during direct database reset: ${dbError}`, 'error');
        // Continue with regular reset process
      }
      
      // Now call the storage method for reset
      const result = await storage.resetWorldState();
      
      if (result) {
        // Reinitialize the server with default state
        if (serverInstance) {
          try {
            // Reset celestial bodies
            if (serverInstance.celestialManager) {
              await serverInstance.celestialManager.initialize();
            }
            
            // We already reset sequences in the server reset, so no need to call again
            // Removing this call to avoid race conditions
            
            // Get celestial bodies for NPC initialization
            const celestialBodies = await storage.getAllCelestialBodies();
            
            // Create default NPCs
            if (celestialBodies.length > 0) {
              log('Reinitializing NPCs after world reset...', 'info');
              await serverInstance.createDefaultNPCs(celestialBodies);
            } else {
              log('Cannot create default NPCs - no celestial bodies found', 'warn');
            }
            
            // Reinitialize the server components immediately
            console.log('Reinitializing server after world reset...');
            
            if (serverInstance) {
              // No need to shut down first - just reinitialize
              serverInstance.reinitializeAfterReset()
                .then(() => {
                  console.log('Server reinitialized successfully!');
                })
                .catch((err) => {
                  console.error('Failed to reinitialize server:', err);
                });
            }
          } catch (err) {
            log(`Error during server reinitialization: ${err}`, 'error');
          }
        }
        
        const response: ApiResponse<{ message: string }> = {
          success: true,
          data: { message: 'World state reset successfully. Server will reinitialize without interruption.' },
        };
        
        res.json(response);
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Failed to reset world state',
        };
        
        res.status(500).json(response);
      }
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to reset world state: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Auto-save settings API
  app.get('/api/settings/auto-save', async (req: Request, res: Response) => {
    try {
      const enabled = await storage.getSettingValue<boolean>('AUTO_SAVE_ENABLED', false);
      const interval = await storage.getSettingValue<number>('AUTO_SAVE_INTERVAL', 300); // Default 5 minutes (300 seconds)
      
      const response: ApiResponse<{ enabled: boolean, interval: number }> = {
        success: true,
        data: { enabled, interval },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to get auto-save settings: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  app.post('/api/settings/auto-save', async (req: Request, res: Response) => {
    try {
      const { enabled, interval } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid enabled value. Expected boolean.',
        });
      }
      
      if (interval !== undefined && (typeof interval !== 'number' || interval < 10)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid interval value. Expected number >= 10 seconds.',
        });
      }
      
      // Update settings
      await storage.updateSetting(
        'AUTO_SAVE_ENABLED',
        enabled.toString(),
        'boolean',
        'persistence',
        'Whether auto-save is enabled'
      );
      
      if (interval !== undefined) {
        await storage.updateSetting(
          'AUTO_SAVE_INTERVAL',
          interval.toString(),
          'number',
          'persistence',
          'Auto-save interval in seconds'
        );
      }
      
      // Get updated settings
      const updatedEnabled = await storage.getSettingValue<boolean>('AUTO_SAVE_ENABLED', false);
      const updatedInterval = await storage.getSettingValue<number>('AUTO_SAVE_INTERVAL', 300);
      
      // Inform the server instance to start/stop auto-save if needed
      if (serverInstance) {
        // These methods would need to be implemented in the main server class
        // if (updatedEnabled) {
        //   serverInstance.startAutoSave(updatedInterval);
        // } else {
        //   serverInstance.stopAutoSave();
        // }
        console.log(`Auto-save ${updatedEnabled ? 'enabled' : 'disabled'} with interval ${updatedInterval} seconds`);
      }
      
      const response: ApiResponse<{ enabled: boolean, interval: number }> = {
        success: true,
        data: { enabled: updatedEnabled, interval: updatedInterval },
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update auto-save settings: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Settings API
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      
      const response: ApiResponse<typeof settings> = {
        success: true,
        data: settings,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to get settings: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  app.post('/api/settings', async (req: Request, res: Response) => {
    try {
      const { name, value, dataType, category, description } = req.body;
      
      if (!name || value === undefined || !dataType || !category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, value, dataType, category',
        });
      }
      
      const setting = await storage.updateSetting(
        name,
        value.toString(),
        dataType,
        category,
        description
      );
      
      const response: ApiResponse<typeof setting> = {
        success: true,
        data: setting,
      };
      
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to update setting: ${error}`,
      };
      
      res.status(500).json(response);
    }
  });
  
  // Get all API endpoints
  app.get('/api/endpoints', (req: Request, res: Response) => {
    const endpoints: {
      path: string;
      method: string;
      description: string;
      group: string;
    }[] = [
      // Server status & settings
      { path: '/api/status', method: 'GET', description: 'Returns server status information', group: 'Server Status & Settings' },
      { path: '/api/settings', method: 'GET', description: 'Get server settings', group: 'Server Status & Settings' },
      { path: '/api/settings', method: 'PUT', description: 'Update server settings', group: 'Server Status & Settings' },
      { path: '/api/stats', method: 'GET', description: 'Get server performance statistics', group: 'Server Status & Settings' },
      { path: '/api/logs', method: 'GET', description: 'Get server logs', group: 'Server Status & Settings' },
      { path: '/api/emergency-stop', method: 'POST', description: 'Emergency stop the server', group: 'Server Status & Settings' },
      { path: '/api/endpoints', method: 'GET', description: 'Get all API endpoints', group: 'Server Status & Settings' },
      { path: '/api/settings/auto-save', method: 'GET', description: 'Get auto-save settings', group: 'Server Status & Settings' },
      { path: '/api/settings/auto-save', method: 'POST', description: 'Update auto-save settings', group: 'Server Status & Settings' },
      { path: '/api/world/save', method: 'POST', description: 'Manually save world state', group: 'Server Status & Settings' },
      { path: '/api/world/load', method: 'POST', description: 'Load saved world state', group: 'Server Status & Settings' },
      { path: '/api/world/reset', method: 'POST', description: 'Reset world state to default', group: 'Server Status & Settings' },
      
      // Celestial bodies
      { path: '/api/celestial', method: 'GET', description: 'Get all celestial bodies', group: 'Celestial Bodies' },
      { path: '/api/celestial/:id', method: 'GET', description: 'Get a specific celestial body by ID', group: 'Celestial Bodies' },
      { path: '/api/celestial', method: 'POST', description: 'Create a new celestial body', group: 'Celestial Bodies' },
      { path: '/api/celestial/:id', method: 'PUT', description: 'Update a celestial body', group: 'Celestial Bodies' },
      { path: '/api/celestial/:id', method: 'DELETE', description: 'Delete a celestial body', group: 'Celestial Bodies' },
      { path: '/api/celestial/settings', method: 'GET', description: 'Get celestial simulation settings', group: 'Celestial Bodies' },
      { path: '/api/celestial/simulation', method: 'PUT', description: 'Update celestial simulation settings', group: 'Celestial Bodies' },
      { path: '/api/celestial/simulation/speed', method: 'GET', description: 'Get simulation speed', group: 'Celestial Bodies' },
      { path: '/api/celestial/simulation/speed', method: 'PUT', description: 'Update simulation speed', group: 'Celestial Bodies' },
      { path: '/api/celestial/simulation/test', method: 'POST', description: 'Test celestial simulation', group: 'Celestial Bodies' },
      { path: '/api/celestial/frozen', method: 'GET', description: 'Get frozen solar system state', group: 'Celestial Bodies' },
      { path: '/api/celestial/frozen', method: 'POST', description: 'Toggle frozen solar system mode', group: 'Celestial Bodies' },
      
      // NPCs & Fleets
      { path: '/api/npc/fleets', method: 'GET', description: 'Get all NPC fleets', group: 'NPCs & Fleets' },
      { path: '/api/npc/fleets', method: 'POST', description: 'Create a new NPC fleet', group: 'NPCs & Fleets' },
      { path: '/api/npc/fleets/:fleetId', method: 'DELETE', description: 'Delete an NPC fleet', group: 'NPCs & Fleets' },
      { path: '/api/npc/fleet/:fleetId/ships', method: 'GET', description: 'Get all ships in a fleet', group: 'NPCs & Fleets' },
      { path: '/api/npc/ship/:npcId/waypoints', method: 'GET', description: 'Get waypoints for a specific NPC ship', group: 'NPCs & Fleets' },
      { path: '/api/npc/ship/:npcId/waypoints', method: 'POST', description: 'Set waypoints for a specific NPC ship', group: 'NPCs & Fleets' },
      { path: '/api/npc/ship/:npcId/waypoints', method: 'DELETE', description: 'Clear waypoints for a specific NPC ship', group: 'NPCs & Fleets' },
      { path: '/api/npc/fleet/:fleetId/formation', method: 'POST', description: 'Set fleet formation with a leader', group: 'NPCs & Fleets' },
      { path: '/api/npc/fleet/:fleetId/formation', method: 'DELETE', description: 'Clear fleet formation', group: 'NPCs & Fleets' },
      
      // Players
      { path: '/api/players', method: 'GET', description: 'Get all connected players', group: 'Players' },
      { path: '/api/simulated-players', method: 'GET', description: 'Get all simulated players', group: 'Players' },
      { path: '/api/simulated-players', method: 'POST', description: 'Create simulated players', group: 'Players' },
      { path: '/api/simulated-players', method: 'DELETE', description: 'Delete all simulated players', group: 'Players' },
      
      // Area of Interest
      { path: '/api/aoi', method: 'GET', description: 'Get all areas of interest', group: 'Area of Interest' },
      
      // Missions
      { path: '/api/missions', method: 'GET', description: 'Get all missions', group: 'Missions' },
      { path: '/api/missions/:missionId', method: 'GET', description: 'Get a specific mission by ID', group: 'Missions' },
      { path: '/api/missions/:missionId', method: 'DELETE', description: 'Delete a mission', group: 'Missions' },
      { path: '/api/missions/:missionId/assign', method: 'PUT', description: 'Assign a mission to a fleet', group: 'Missions' }
    ];
    
    res.json({ success: true, data: endpoints });
  });
  
  return httpServer;
}
