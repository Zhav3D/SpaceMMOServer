import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Vector3 } from "@shared/math";
import { serverInstance } from "./index";

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
      
      res.json(response);
    } catch (error) {
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
  
  // Set simulation speed API
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
      serverInstance.celestialManager.setSimulationSpeed(parseFloat(speed));
      
      const response: ApiResponse<{ simulationSpeed: number }> = {
        success: true,
        data: { simulationSpeed: parseFloat(speed) },
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

  return httpServer;
}
