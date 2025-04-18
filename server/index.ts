import express from 'express';
import { registerRoutes } from './routes';
import { UDPServer } from './udp';
import { Vector3, Quaternion } from '@shared/math';
import { 
  MessageType, 
  ServerSettings, 
  ClientConnectMessage, 
  ClientStateUpdateMessage 
} from '@shared/types';
import { CelestialBody, npcShips, npcFleets } from '@shared/schema';
import { db } from './db';
import { storage } from './storage';
import { AOIManager } from './aoi';
import { GameStateManager } from './state';
import { NPCManager } from './npc';
import { SanityCheckManager, SanityCheckType } from './sanity';
import { CelestialManager } from './celestial';
import { MissionManager } from './mission';
import { setupVite, serveStatic, log } from './vite';
import os from 'os';

// Server singleton instance
export let serverInstance: GameServer | null = null;

// Game server class to coordinate all components
export class GameServer {
  // Core components
  private udpServer: UDPServer;
  private expressApp: express.Express;
  public aoiManager: AOIManager;
  public gameStateManager: GameStateManager;
  public npcManager: NPCManager;
  public sanityCheckManager: SanityCheckManager;
  public celestialManager: CelestialManager;
  public missionManager: MissionManager;
  
  // Server settings
  private settings: ServerSettings = {
    maxPlayers: 2000,
    tickRate: 20,
    simulationSpeed: 10,
    aoiRadius: 5000,
    aoiMaxEntities: 400,
    aoiGridCellSize: 1000,
    sanityCheckFrequency: 10,
    reliableResendInterval: 1000,
    maxReliableResends: 5,
    disconnectTimeout: 30000,
    logLevel: 'info'
  };
  
  // Tracking
  private startTime: number = Date.now();
  private lastUpdateTime: number = Date.now();
  private isRunning: boolean = false;
  private isShuttingDown: boolean = false;
  
  // Performance metrics
  private lastStatTime: number = Date.now();
  private statInterval: number = 10000; // 10 seconds
  
  constructor(udpPort: number = 7777, httpPort: number = 5000) {
    // Create UDP server
    this.udpServer = new UDPServer(udpPort);
    
    // Create Express app
    this.expressApp = express();
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: false }));
    
    // Create managers
    this.aoiManager = new AOIManager(this.settings.aoiGridCellSize);
    this.npcManager = new NPCManager();
    this.gameStateManager = new GameStateManager(this.udpServer, this.aoiManager, this.npcManager);
    this.sanityCheckManager = new SanityCheckManager(this.udpServer);
    this.celestialManager = new CelestialManager(this.udpServer);
    // Mission Manager will be created after other components are initialized
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Initialize the HTTP server
    this.initializeHttpServer(httpPort);
  }
  
  private setupEventHandlers(): void {
    // Handle UDP messages
    this.udpServer.on('message', (message: any, rinfo: any) => {
      this.handleUdpMessage(message, rinfo);
    });
    
    // Handle client connections
    this.udpServer.on('connect', (message: ClientConnectMessage, rinfo: any) => {
      this.handleClientConnect(message, rinfo);
    });
    
    // Handle client disconnections
    this.udpServer.on('disconnect', (data: { clientId: string, reason: string }) => {
      this.handleClientDisconnect(data.clientId, data.reason);
    });
    
    // Handle UDP errors
    this.udpServer.on('error', (error: Error) => {
      log(`UDP server error: ${error.message}`, 'error');
      
      // Log to storage
      storage.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'ERROR',
        message: `UDP server error: ${error.message}`,
        source: 'udp_server',
        data: { error: error.toString() }
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    });
  }
  
  private async initializeHttpServer(port: number): Promise<void> {
    // Configure Express middleware for request logging
    this.expressApp.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (path.startsWith('/api')) {
          log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, 'http');
        }
      });
      
      next();
    });
    
    // Register API routes
    const httpServer = await registerRoutes(this.expressApp);
    
    // Setup static file serving or Vite development server
    if (this.expressApp.get('env') === 'development') {
      await setupVite(this.expressApp, httpServer);
    } else {
      serveStatic(this.expressApp);
    }
    
    // Start HTTP server
    httpServer.listen({
      port,
      host: '0.0.0.0',
      reusePort: true,
    }, () => {
      log(`HTTP server listening on port ${port}`, 'http');
    });
  }
  
  private handleUdpMessage(message: any, rinfo: any): void {
    try {
      switch (message.messageType) {
        case MessageType.CLIENT_STATE_UPDATE:
          this.handleClientStateUpdate(message as ClientStateUpdateMessage);
          break;
          
        case MessageType.SERVER_SANITY_CHECK:
          // Handle sanity check response
          // TODO: Implement sanity check validation
          break;
          
        // Add cases for other message types as needed
          
        default:
          log(`Received unhandled message type: ${message.messageType} from ${rinfo.address}:${rinfo.port}`, 'warn');
      }
    } catch (error) {
      log(`Error handling UDP message: ${error}`, 'error');
    }
  }
  
  private async handleClientConnect(message: ClientConnectMessage, rinfo: any): Promise<void> {
    const { assignedClientId, username, version } = message;
    
    log(`Client connection request from ${rinfo.address}:${rinfo.port}, username: ${username}, version: ${version}`, 'info');
    
    // Check if server is full
    const playerCount = this.gameStateManager.getPlayerCount();
    if (playerCount >= this.settings.maxPlayers) {
      this.udpServer.sendToClient(assignedClientId, {
        messageType: MessageType.SERVER_REJECT,
        clientId: assignedClientId,
        reason: 'Server is full'
      });
      
      this.udpServer.disconnectClient(assignedClientId, 'server_full');
      return;
    }
    
    // Check version compatibility (simple string match for now)
    const requiredVersion = '1.0'; // Example version requirement
    if (version && !version.startsWith(requiredVersion)) {
      this.udpServer.sendToClient(assignedClientId, {
        messageType: MessageType.SERVER_REJECT,
        clientId: assignedClientId,
        reason: `Incompatible client version. Server requires ${requiredVersion}.x`
      });
      
      this.udpServer.disconnectClient(assignedClientId, 'version_mismatch');
      return;
    }
    
    try {
      // Check if user exists (if not, create one for testing)
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({
          username,
          password: 'password' // In a real app, we'd use proper authentication
        });
      }
      
      // Initial position (could be randomized or determined by game logic)
      const initialPosition = new Vector3(0, 0, 0);
      const initialVelocity = new Vector3(0, 0, 0);
      const initialRotation = Quaternion.identity();
      
      // Create player record
      const player = await storage.createPlayer({
        userId: user.id,
        clientId: assignedClientId,
        positionX: initialPosition.x,
        positionY: initialPosition.y,
        positionZ: initialPosition.z,
        velocityX: initialVelocity.x,
        velocityY: initialVelocity.y,
        velocityZ: initialVelocity.z,
        rotationX: initialRotation.x,
        rotationY: initialRotation.y,
        rotationZ: initialRotation.z,
        rotationW: initialRotation.w,
        nearestCelestialBodyId: 1, // Default to first celestial body
        lastUpdate: Date.now() / 1000,
        isConnected: true,
        ipAddress: rinfo.address,
        port: rinfo.port
      });
      
      // Register player with game state manager
      this.gameStateManager.registerPlayer(player);
      
      // Send accept message to client
      this.udpServer.sendToClient(assignedClientId, {
        messageType: MessageType.SERVER_ACCEPT,
        clientId: assignedClientId,
        assignedClientId,
        serverTime: Date.now(),
        initialPosition,
        initialVelocity,
        initialRotation
      }, true); // Send reliably
      
      // Send initial state updates
      this.celestialManager.sendCelestialUpdates(assignedClientId);
      this.gameStateManager.sendAreaOfInterestUpdate(assignedClientId);
      
      log(`Client ${assignedClientId} (${username}) successfully connected`, 'info');
    } catch (error) {
      log(`Error handling client connect: ${error}`, 'error');
      
      this.udpServer.sendToClient(assignedClientId, {
        messageType: MessageType.SERVER_REJECT,
        clientId: assignedClientId,
        reason: 'Internal server error'
      });
      
      this.udpServer.disconnectClient(assignedClientId, 'server_error');
    }
  }
  
  private handleClientDisconnect(clientId: string, reason: string): void {
    log(`Client ${clientId} disconnected: ${reason}`, 'info');
    
    try {
      // Update player record
      storage.getPlayerByClientId(clientId)
        .then(player => {
          if (player) {
            storage.updatePlayer(player.id, { isConnected: false });
          }
        })
        .catch(error => {
          log(`Error updating player record: ${error}`, 'error');
        });
      
      // Remove from game state
      this.gameStateManager.removePlayer(clientId);
    } catch (error) {
      log(`Error handling client disconnect: ${error}`, 'error');
    }
  }
  
  private handleClientStateUpdate(message: ClientStateUpdateMessage): void {
    const { clientId, position, velocity, rotation } = message;
    
    // Update game state
    this.gameStateManager.updatePlayerState(clientId, position, velocity, rotation);
    
    // Run occasional sanity checks
    if (Math.random() < 1 / this.settings.sanityCheckFrequency) {
      this.sanityCheckManager.runCheck(
        clientId, 
        SanityCheckType.VELOCITY, 
        { 
          velocityX: velocity.x, 
          velocityY: velocity.y, 
          velocityZ: velocity.z 
        } as any
      );
    }
  }
  
  // Start the server
  public async start(): Promise<void> {
    if (this.isRunning) {
      log('Server is already running', 'warn');
      return;
    }
    
    try {
      // Initialize components
      log('Initializing Area of Interest system...', 'info');
      await this.initializeAOI();
      
      log('Initializing Celestial bodies...', 'info');
      await this.celestialManager.initialize();
      
      log('Initializing NPC system...', 'info');
      await this.initializeNPCs();
      
      log('Initializing Game State...', 'info');
      await this.gameStateManager.initialize();
      
      // Initialize Mission Manager
      log('Initializing Mission system...', 'info');
      this.missionManager = new MissionManager(
        this.udpServer,
        this.gameStateManager,
        this.npcManager,
        this.celestialManager
      );
      await this.missionManager.initialize();
      
      // Start update loops
      this.startUpdateLoops();
      
      this.isRunning = true;
      this.isShuttingDown = false;
      log('Server started successfully', 'info');
      
      // Create initial server stat
      this.recordServerStats();
    } catch (error) {
      log(`Failed to start server: ${error}`, 'error');
      throw error;
    }
  }
  
  // Method to reinitialize the server after a world reset without restarting the application
  public async reinitializeAfterReset(): Promise<void> {
    try {
      // Pause the update loops temporarily
      const wasRunning = this.isRunning;
      this.isRunning = false;
      
      // Reinitialize all components
      log('Reinitializing server components after world reset...', 'info');
      
      // Reset AOI Manager
      log('Reinitializing Areas of Interest...', 'info');
      this.aoiManager = new AOIManager(this.settings.aoiGridCellSize);
      await this.initializeAOI();
      
      // Reload celestial bodies
      log('Reinitializing celestial bodies...', 'info');
      await this.celestialManager.initialize();
      
      // Reload NPC system
      log('Reinitializing NPC system...', 'info');
      await this.initializeNPCs();
      
      // Reload Game State
      log('Reinitializing Game State...', 'info');
      await this.gameStateManager.initialize();
      
      // Reinitialize Mission Manager
      log('Reinitializing Mission system...', 'info');
      if (this.missionManager) {
        await this.missionManager.initialize();
      } else {
        this.missionManager = new MissionManager(
          this.udpServer,
          this.gameStateManager,
          this.npcManager,
          this.celestialManager
        );
        await this.missionManager.initialize();
      }
      
      // Resume server only if it was running before
      this.isRunning = wasRunning;
      this.isShuttingDown = false;
      log('Server reinitialized successfully', 'info');
      
      // Record server stats after reinitialization
      this.recordServerStats();
    } catch (error) {
      log(`Failed to reinitialize server: ${error}`, 'error');
      throw error;
    }
  }
  
  // Initialize areas of interest
  private async initializeAOI(): Promise<void> {
    try {
      // Get existing areas from storage
      const areas = await storage.getAllAreasOfInterest();
      
      // Clear existing areas from storage first
      await storage.clearAllAreasOfInterest();
      
      // Create default areas
      log('Creating default areas of interest...', 'info');
      
      // Earth orbit
      const earthOrbit = await storage.createAreaOfInterest({
        name: 'Earth Orbit (Alpha Sector)',
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        radius: this.settings.aoiRadius,
        nearestCelestialBodyId: 3, // Earth
        playerCount: 0,
        npcCount: 0,
        updateFrequency: 60,
        latency: 0,
        load: 0,
        capacityLimit: this.settings.aoiMaxEntities,
      });
      
      this.aoiManager.createArea(
        `aoi-${earthOrbit.id}`,
        earthOrbit.name,
        new Vector3(earthOrbit.centerX, earthOrbit.centerY, earthOrbit.centerZ),
        earthOrbit.radius,
        earthOrbit.capacityLimit
      );
      
      // Mars colony
      const marsColony = await storage.createAreaOfInterest({
        name: 'Mars Colony (Beta Sector)',
        centerX: 200000000,
        centerY: 0,
        centerZ: 0,
        radius: this.settings.aoiRadius,
        nearestCelestialBodyId: 4, // Mars
        playerCount: 0,
        npcCount: 0,
        updateFrequency: 40,
        latency: 0,
        load: 0,
        capacityLimit: this.settings.aoiMaxEntities,
      });
      
      this.aoiManager.createArea(
        `aoi-${marsColony.id}`,
        marsColony.name,
        new Vector3(marsColony.centerX, marsColony.centerY, marsColony.centerZ),
        marsColony.radius,
        marsColony.capacityLimit
      );
      
      // Jupiter mining belt
      const jupiterMining = await storage.createAreaOfInterest({
        name: 'Jupiter Mining Belt (Gamma Sector)',
        centerX: 600000000,
        centerY: 0,
        centerZ: 0,
        radius: this.settings.aoiRadius,
        nearestCelestialBodyId: 5, // Jupiter
        playerCount: 0,
        npcCount: 0,
        updateFrequency: 30,
        latency: 0,
        load: 0,
        capacityLimit: this.settings.aoiMaxEntities,
      });
      
      this.aoiManager.createArea(
        `aoi-${jupiterMining.id}`,
        jupiterMining.name,
        new Vector3(jupiterMining.centerX, jupiterMining.centerY, jupiterMining.centerZ),
        jupiterMining.radius,
        jupiterMining.capacityLimit
      );
      
      // Saturn rings
      const saturnRings = await storage.createAreaOfInterest({
        name: 'Saturn Rings (Delta Sector)',
        centerX: 1200000000,
        centerY: 0,
        centerZ: 0,
        radius: this.settings.aoiRadius,
        nearestCelestialBodyId: 6, // Saturn
        playerCount: 0,
        npcCount: 0,
        updateFrequency: 60,
        latency: 0,
        load: 0,
        capacityLimit: this.settings.aoiMaxEntities,
      });
      
      this.aoiManager.createArea(
        `aoi-${saturnRings.id}`,
        saturnRings.name,
        new Vector3(saturnRings.centerX, saturnRings.centerY, saturnRings.centerZ),
        saturnRings.radius,
        saturnRings.capacityLimit
      );
      
      log(`Initialized ${this.aoiManager.getAllAreas().length} areas of interest`, 'info');
    } catch (error) {
      log(`Error initializing areas of interest: ${error}`, 'error');
      throw error;
    }
  }
  
  // Initialize NPC fleets
  private async initializeNPCs(): Promise<void> {
    try {
      // Load celestial bodies first
      const celestialBodies = await storage.getAllCelestialBodies();
      this.npcManager.registerCelestialBodies(celestialBodies);
      
      // Load ship templates (new step for template-based NPCs)
      const shipTemplates = await storage.getAllShipTemplates();
      this.npcManager.registerShipTemplates(shipTemplates);
      
      // Load existing NPC ships
      const npcShips = await storage.getAllNpcShips();
      this.npcManager.registerNPCs(npcShips);
      
      // Load existing fleets
      const npcFleets = await storage.getAllNpcFleets();
      this.npcManager.registerFleets(npcFleets);
      
      // Create default fleets if none exist
      if (npcFleets.length === 0) {
        await this.createDefaultNPCs(celestialBodies);
      }
      
      log(`Initialized NPCs: ${npcShips.length} ships in ${npcFleets.length} fleets`, 'info');
    } catch (error) {
      log(`Error initializing NPCs: ${error}`, 'error');
      throw error;
    }
  }
  
  // Create default NPCs with higher counts
  public async createDefaultNPCs(celestialBodies: CelestialBody[]): Promise<void> {
    try {
      log('Creating default NPC fleets with increased counts...', 'info');
      
      // Manually delete all existing NPCs and fleets to avoid duplicate key issues
      // This is needed after a reset because the server instance might still have stale NPC data
      this.npcManager.clearAllNPCs();
      
      // Also ensure the database is clean
      // We normally shouldn't need this since resetWorldState clears tables,
      // but we'll do it here as an extra safety measure
      try {
        await db.delete(npcShips);
        await db.delete(npcFleets);
        log('Cleared existing NPCs and fleets from database', 'info');
      } catch (err) {
        log(`Warning: Error clearing NPCs: ${err}`, 'warn');
      }

      let totalShips = 0;
      let totalFleets = 0;
      
      // Helper function to create and save a fleet and its ships
      const createAndSaveFleet = async (
        type: string, 
        count: number, 
        location: string, 
        celestialBodyId: number
      ) => {
        // Create the fleet with NPC Manager (in-memory) - now uses ship templates
        const { fleet, ships } = await this.npcManager.createNPCFleet(
          type as any, 
          count, 
          location, 
          celestialBodyId
        );
        
        // Save fleet to database
        const savedFleet = await storage.createNpcFleet(fleet);
        this.npcManager.registerFleet(savedFleet);
        
        // Create and save all ships
        for (const ship of ships) {
          const savedShip = await storage.createNpcShip(ship);
          this.npcManager.registerNPC(savedShip);
        }
        
        totalShips += ships.length;
        totalFleets++;
        
        log(`Created ${type} fleet (${location}) with ${ships.length} ships`, 'info');
        
        return { fleet: savedFleet, ships };
      };
      
      // Find all needed celestial bodies
      const earth = celestialBodies.find(body => body.name === 'Earth');
      const mars = celestialBodies.find(body => body.name === 'Mars');
      const jupiter = celestialBodies.find(body => body.name === 'Jupiter');
      const saturn = celestialBodies.find(body => body.name === 'Saturn');
      const venus = celestialBodies.find(body => body.name === 'Venus');
      const mercury = celestialBodies.find(body => body.name === 'Mercury');
      
      // Create fleets for each celestial body if they exist

      // Earth fleets
      if (earth) {
        await createAndSaveFleet('enemy', 15, 'Earth Orbit', earth.id);
        await createAndSaveFleet('enemy', 10, 'Earth Defense', earth.id);
        await createAndSaveFleet('civilian', 20, 'Earth Tourism', earth.id);
      }
      
      // Mars fleets
      if (mars) {
        await createAndSaveFleet('transport', 12, 'Mars Colonization', mars.id);
        await createAndSaveFleet('mining', 15, 'Mars Mining', mars.id);
      }
      
      // Jupiter fleets
      if (jupiter) {
        await createAndSaveFleet('transport', 10, 'Jupiter → Mars', jupiter.id);
        await createAndSaveFleet('mining', 15, 'Asteroid Belt', jupiter.id);
      }
      
      // Saturn fleets
      if (saturn) {
        await createAndSaveFleet('civilian', 18, 'Saturn Rings', saturn.id);
        await createAndSaveFleet('mining', 12, 'Saturn Ring Mining', saturn.id);
      }
      
      // Venus fleets
      if (venus) {
        await createAndSaveFleet('civilian', 15, 'Venus Exploration', venus.id);
        await createAndSaveFleet('enemy', 12, 'Venus Orbit', venus.id);
      }
      
      // Mercury fleet
      if (mercury) {
        await createAndSaveFleet('mining', 10, 'Mercury Mining', mercury.id);
      }
      
      // Transport route between multiple planets
      if (mars && jupiter) {
        await createAndSaveFleet('transport', 12, 'Mars → Jupiter', mars.id);
      }
      
      log(`Successfully created ${totalFleets} fleets with a total of ${totalShips} ships`, 'info');
    } catch (error) {
      log(`Error creating default NPCs: ${error}`, 'error');
      throw error;
    }
  }
  
  // Start all update loops
  private startUpdateLoops(): void {
    // Calculate tick interval based on tick rate
    const tickInterval = Math.floor(1000 / this.settings.tickRate);
    
    // Main game loop
    setInterval(() => this.update(), tickInterval);
    
    // Celestial update loop (less frequent)
    setInterval(() => this.celestialManager.update(), 1000);
    
    // Broadcast celestial updates (even less frequent)
    setInterval(() => this.celestialManager.sendCelestialUpdates(), 5000);
    
    // NPC state updates
    setInterval(() => this.gameStateManager.sendNPCUpdates(), 500);
    
    // Mission updates
    // The mission manager has its own internal update timers
    
    // Sanity check cleanup
    setInterval(() => this.sanityCheckManager.cleanupOldChecks(), 10000);
    
    // Server statistics recording
    setInterval(() => this.recordServerStats(), this.statInterval);
  }
  
  // Main update method
  private update(): void {
    if (this.isShuttingDown) return;
    
    try {
      // Calculate delta time
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;
      
      // Update celestial bodies
      this.celestialManager.update();
      
      // Update simulated players
      this.gameStateManager.updateSimulatedPlayers(deltaTime);
      
      // Update game state and send to clients
      this.gameStateManager.sendStateUpdates();
    } catch (error) {
      log(`Error in update loop: ${error}`, 'error');
    }
  }
  
  // Record server statistics
  private recordServerStats(): void {
    try {
      // Get CPU usage
      const cpuUsage = process.cpuUsage();
      const cpuUsagePercent = this.calculateCpuUsage(cpuUsage);
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      
      // Get network stats - this is a simplification, 
      // in a real app we'd track actual bytes sent/received
      const networkTraffic = this.gameStateManager.getPlayerCount() * 2; // MB/s approximation
      
      // Get player count
      const playerCount = this.gameStateManager.getPlayerCount();
      
      // Store in database
      storage.createServerStat({
        timestamp: Date.now() / 1000,
        cpuLoad: cpuUsagePercent,
        memoryUsage: memoryUsageMB,
        networkTraffic,
        playerCount
      }).catch(error => {
        log(`Error recording server stats: ${error}`, 'error');
      });
      
      // Log to console if needed
      if (this.settings.logLevel === 'debug') {
        log(`Server stats: CPU ${cpuUsagePercent.toFixed(1)}%, Memory ${memoryUsageMB}MB, Network ${networkTraffic}MB/s, Players ${playerCount}`, 'debug');
      }
    } catch (error) {
      log(`Error recording server stats: ${error}`, 'error');
    }
  }
  
  // Calculate CPU usage percentage
  private calculateCpuUsage(cpuUsage: { user: number, system: number }): number {
    const now = Date.now();
    const elapsed = now - this.lastStatTime;
    this.lastStatTime = now;
    
    // Calculate percentage
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const totalTime = elapsed * 1000; // Convert to microseconds
    
    // Adjust for number of cores
    const numCores = os.cpus().length;
    
    // Calculate as percentage of available CPU time
    return Math.min(100, (totalUsage / totalTime) * 100 / numCores);
  }
  
  // Shut down the server
  public shutdown(): void {
    if (!this.isRunning || this.isShuttingDown) {
      log('Server is already stopping or not running', 'warn');
      return;
    }
    
    this.isShuttingDown = true;
    log('Server is shutting down...', 'info');
    
    try {
      // Disconnect all clients
      const clientIds = this.udpServer.getConnectedClients();
      for (const clientId of clientIds) {
        this.udpServer.disconnectClient(clientId, 'server_shutdown');
      }
      
      // Close UDP server
      this.udpServer.close();
      
      log('Server has been shut down', 'info');
      this.isRunning = false;
    } catch (error) {
      log(`Error shutting down server: ${error}`, 'error');
    }
  }
  
  // Emergency stop the server
  public emergencyStop(): void {
    log('EMERGENCY STOP initiated!', 'error');
    
    // Log event
    storage.createServerLog({
      timestamp: Date.now() / 1000,
      level: 'ERROR',
      message: 'Emergency stop initiated',
      source: 'server',
      data: { uptime: this.getUptime() }
    }).catch(err => {
      console.error('Failed to log emergency stop:', err);
    });
    
    // Perform shutdown
    this.shutdown();
    
    // In a real system, we might want to exit the process
    // process.exit(1);
  }
  
  // Get server uptime in seconds
  public getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
  
  // Get player count
  public getPlayerCount(): number {
    return this.gameStateManager.getPlayerCount();
  }
  
  // Get current server settings
  public getSettings(): ServerSettings {
    return { ...this.settings };
  }
  
  // Update server settings
  public updateSettings(newSettings: Partial<ServerSettings>): void {
    // Update only provided settings
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    // Apply settings to various components
    if (newSettings.aoiRadius) {
      // Note: Changing AOI radius at runtime would require more complex logic
      log('Warning: Changing AOI radius at runtime may not affect existing areas', 'warn');
    }
    
    if (newSettings.sanityCheckFrequency) {
      // Nothing to do here, it's used directly in the update loop
    }
    
    log('Server settings updated', 'info');
  }
}

// Initialize the server when this module is loaded
const initializeServer = async () => {
  try {
    const udpPort = parseInt(process.env.UDP_PORT || '7777', 10);
    const httpPort = 5000; // Using port 5000 for all traffic as per requirements
    
    serverInstance = new GameServer(udpPort, httpPort);
    await serverInstance.start();
  } catch (error) {
    log(`Failed to initialize server: ${error}`, 'error');
  }
};

// Start the server
initializeServer();

