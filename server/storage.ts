import { 
  User, InsertUser, 
  CelestialBody, InsertCelestialBody,
  NpcShip, InsertNpcShip,
  NpcFleet, InsertNpcFleet,
  Player, InsertPlayer,
  AreaOfInterest as AreaOfInterestRecord, InsertAreaOfInterest,
  ServerLog, InsertServerLog,
  ServerStat, InsertServerStat
} from '@shared/schema';
import { Vector3 } from '@shared/math';
import { AreaOfInterestState } from '@shared/types';

// Extend the storage interface with all the required methods
export interface IStorage {
  // Original methods (from default template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Celestial Bodies
  getCelestialBody(id: number): Promise<CelestialBody | undefined>;
  getAllCelestialBodies(): Promise<CelestialBody[]>;
  createCelestialBody(body: InsertCelestialBody): Promise<CelestialBody>;
  updateCelestialBody(id: number, body: Partial<CelestialBody>): Promise<CelestialBody | undefined>;
  deleteCelestialBody(id: number): Promise<boolean>;
  
  // NPC Ships
  getNpcShip(id: number): Promise<NpcShip | undefined>;
  getNpcShipsByFleet(fleetId: string): Promise<NpcShip[]>;
  getAllNpcShips(): Promise<NpcShip[]>;
  createNpcShip(ship: InsertNpcShip): Promise<NpcShip>;
  updateNpcShip(id: number, ship: Partial<NpcShip>): Promise<NpcShip | undefined>;
  deleteNpcShip(id: number): Promise<boolean>;
  
  // NPC Fleets
  getNpcFleet(id: number): Promise<NpcFleet | undefined>;
  getNpcFleetByFleetId(fleetId: string): Promise<NpcFleet | undefined>;
  getAllNpcFleets(): Promise<NpcFleet[]>;
  createNpcFleet(fleet: InsertNpcFleet): Promise<NpcFleet>;
  updateNpcFleet(id: number, fleet: Partial<NpcFleet>): Promise<NpcFleet | undefined>;
  deleteNpcFleet(id: number): Promise<boolean>;
  
  // Players
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByClientId(clientId: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  getConnectedPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  
  // Areas of Interest
  getAreaOfInterest(id: number): Promise<AreaOfInterestRecord | undefined>;
  getAllAreasOfInterest(): Promise<AreaOfInterestRecord[]>;
  createAreaOfInterest(area: InsertAreaOfInterest): Promise<AreaOfInterestRecord>;
  updateAreaOfInterest(id: number, area: Partial<AreaOfInterestRecord>): Promise<AreaOfInterestRecord | undefined>;
  deleteAreaOfInterest(id: number): Promise<boolean>;
  
  // Server Logs
  createServerLog(log: InsertServerLog): Promise<ServerLog>;
  getRecentLogs(limit: number, level?: string): Promise<ServerLog[]>;
  
  // Server Stats
  createServerStat(stat: InsertServerStat): Promise<ServerStat>;
  getRecentStats(limit: number): Promise<ServerStat[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private celestialBodies: Map<number, CelestialBody>;
  private npcShips: Map<number, NpcShip>;
  private npcFleets: Map<number, NpcFleet>;
  private players: Map<number, Player>;
  private areasOfInterest: Map<number, AreaOfInterestRecord>;
  private serverLogs: ServerLog[];
  private serverStats: ServerStat[];
  
  // ID counters
  private userId: number;
  private celestialBodyId: number;
  private npcShipId: number;
  private npcFleetId: number;
  private playerId: number;
  private areaOfInterestId: number;
  private serverLogId: number;
  private serverStatId: number;

  constructor() {
    this.users = new Map();
    this.celestialBodies = new Map();
    this.npcShips = new Map();
    this.npcFleets = new Map();
    this.players = new Map();
    this.areasOfInterest = new Map();
    this.serverLogs = [];
    this.serverStats = [];
    
    this.userId = 1;
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.playerId = 1;
    this.areaOfInterestId = 1;
    this.serverLogId = 1;
    this.serverStatId = 1;
  }

  // User methods (from original template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Celestial Body methods
  async getCelestialBody(id: number): Promise<CelestialBody | undefined> {
    return this.celestialBodies.get(id);
  }
  
  async getAllCelestialBodies(): Promise<CelestialBody[]> {
    return Array.from(this.celestialBodies.values());
  }
  
  async createCelestialBody(body: InsertCelestialBody): Promise<CelestialBody> {
    const id = this.celestialBodyId++;
    const celestialBody: CelestialBody = { ...body, id };
    this.celestialBodies.set(id, celestialBody);
    return celestialBody;
  }
  
  async updateCelestialBody(id: number, body: Partial<CelestialBody>): Promise<CelestialBody | undefined> {
    const existing = this.celestialBodies.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...body };
    this.celestialBodies.set(id, updated);
    return updated;
  }
  
  async deleteCelestialBody(id: number): Promise<boolean> {
    return this.celestialBodies.delete(id);
  }
  
  // NPC Ship methods
  async getNpcShip(id: number): Promise<NpcShip | undefined> {
    return this.npcShips.get(id);
  }
  
  async getNpcShipsByFleet(fleetId: string): Promise<NpcShip[]> {
    return Array.from(this.npcShips.values()).filter(
      (ship) => ship.fleetId === fleetId
    );
  }
  
  async getAllNpcShips(): Promise<NpcShip[]> {
    return Array.from(this.npcShips.values());
  }
  
  async createNpcShip(ship: InsertNpcShip): Promise<NpcShip> {
    const id = this.npcShipId++;
    const npcShip: NpcShip = { ...ship, id };
    this.npcShips.set(id, npcShip);
    return npcShip;
  }
  
  async updateNpcShip(id: number, ship: Partial<NpcShip>): Promise<NpcShip | undefined> {
    const existing = this.npcShips.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...ship };
    this.npcShips.set(id, updated);
    return updated;
  }
  
  async deleteNpcShip(id: number): Promise<boolean> {
    return this.npcShips.delete(id);
  }
  
  // NPC Fleet methods
  async getNpcFleet(id: number): Promise<NpcFleet | undefined> {
    return this.npcFleets.get(id);
  }
  
  async getNpcFleetByFleetId(fleetId: string): Promise<NpcFleet | undefined> {
    return Array.from(this.npcFleets.values()).find(
      (fleet) => fleet.fleetId === fleetId
    );
  }
  
  async getAllNpcFleets(): Promise<NpcFleet[]> {
    return Array.from(this.npcFleets.values());
  }
  
  async createNpcFleet(fleet: InsertNpcFleet): Promise<NpcFleet> {
    const id = this.npcFleetId++;
    const npcFleet: NpcFleet = { ...fleet, id };
    this.npcFleets.set(id, npcFleet);
    return npcFleet;
  }
  
  async updateNpcFleet(id: number, fleet: Partial<NpcFleet>): Promise<NpcFleet | undefined> {
    const existing = this.npcFleets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...fleet };
    this.npcFleets.set(id, updated);
    return updated;
  }
  
  async deleteNpcFleet(id: number): Promise<boolean> {
    return this.npcFleets.delete(id);
  }
  
  // Player methods
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async getPlayerByClientId(clientId: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      (player) => player.clientId === clientId
    );
  }
  
  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }
  
  async getConnectedPlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      (player) => player.isConnected
    );
  }
  
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.playerId++;
    const newPlayer: Player = { ...player, id };
    this.players.set(id, newPlayer);
    return newPlayer;
  }
  
  async updatePlayer(id: number, player: Partial<Player>): Promise<Player | undefined> {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...player };
    this.players.set(id, updated);
    return updated;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    return this.players.delete(id);
  }
  
  // Area of Interest methods
  async getAreaOfInterest(id: number): Promise<AreaOfInterestRecord | undefined> {
    return this.areasOfInterest.get(id);
  }
  
  async getAllAreasOfInterest(): Promise<AreaOfInterestRecord[]> {
    return Array.from(this.areasOfInterest.values());
  }
  
  async createAreaOfInterest(area: InsertAreaOfInterest): Promise<AreaOfInterestRecord> {
    const id = this.areaOfInterestId++;
    const newArea: AreaOfInterestRecord = { ...area, id };
    this.areasOfInterest.set(id, newArea);
    return newArea;
  }
  
  async updateAreaOfInterest(id: number, area: Partial<AreaOfInterestRecord>): Promise<AreaOfInterestRecord | undefined> {
    const existing = this.areasOfInterest.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...area };
    this.areasOfInterest.set(id, updated);
    return updated;
  }
  
  async deleteAreaOfInterest(id: number): Promise<boolean> {
    return this.areasOfInterest.delete(id);
  }
  
  // Server Log methods
  async createServerLog(log: InsertServerLog): Promise<ServerLog> {
    const id = this.serverLogId++;
    const serverLog: ServerLog = { ...log, id };
    this.serverLogs.push(serverLog);
    
    // Keep only the most recent logs (e.g., last 1000)
    const maxLogs = 1000;
    if (this.serverLogs.length > maxLogs) {
      this.serverLogs = this.serverLogs.slice(-maxLogs);
    }
    
    return serverLog;
  }
  
  async getRecentLogs(limit: number, level?: string): Promise<ServerLog[]> {
    let logs = [...this.serverLogs];
    
    // Sort by timestamp (descending)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Filter by level if specified
    if (level) {
      logs = logs.filter((log) => log.level === level);
    }
    
    // Return limited number
    return logs.slice(0, limit);
  }
  
  // Server Stats methods
  async createServerStat(stat: InsertServerStat): Promise<ServerStat> {
    const id = this.serverStatId++;
    const serverStat: ServerStat = { ...stat, id };
    this.serverStats.push(serverStat);
    
    // Keep only the most recent stats (e.g., last 1000)
    const maxStats = 1000;
    if (this.serverStats.length > maxStats) {
      this.serverStats = this.serverStats.slice(-maxStats);
    }
    
    return serverStat;
  }
  
  async getRecentStats(limit: number): Promise<ServerStat[]> {
    // Sort by timestamp (descending)
    const stats = [...this.serverStats].sort((a, b) => b.timestamp - a.timestamp);
    
    // Return limited number
    return stats.slice(0, limit);
  }
}

// Create a singleton instance of the storage
export const storage = new MemStorage();
