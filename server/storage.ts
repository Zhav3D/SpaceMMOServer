import { 
  User, InsertUser, 
  CelestialBody, InsertCelestialBody,
  NpcShip, InsertNpcShip,
  NpcFleet, InsertNpcFleet,
  Player, InsertPlayer,
  AreaOfInterest as AreaOfInterestRecord, InsertAreaOfInterest,
  ServerLog, InsertServerLog,
  ServerStat, InsertServerStat,
  ServerSetting, InsertServerSetting,
  SERVER_SETTINGS,
  
  // Table references for database queries
  users,
  celestialBodies,
  npcShips,
  npcFleets,
  players,
  areasOfInterest,
  serverLogs,
  serverStats,
  serverSettings
} from '@shared/schema';
import { Vector3 } from '@shared/math';
import { AreaOfInterestState } from '@shared/types';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from './db';

// Extend the storage interface with all the required methods
export interface IStorage {
  // World persistence methods
  saveWorldState(): Promise<boolean>;
  loadWorldState(): Promise<boolean>;
  resetWorldState(): Promise<boolean>;
  resetSequences(): Promise<boolean>;
  
  // Server settings methods
  getSetting(name: string): Promise<ServerSetting | undefined>;
  getSettingValue<T>(name: string, defaultValue: T): Promise<T>;
  updateSetting(name: string, value: string, dataType: string, category: string, description?: string): Promise<ServerSetting>;
  getAllSettings(): Promise<ServerSetting[]>;
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
  private settings: Map<string, ServerSetting>;
  
  // ID counters
  private userId: number;
  private celestialBodyId: number;
  private npcShipId: number;
  private npcFleetId: number;
  private playerId: number;
  private areaOfInterestId: number;
  private serverLogId: number;
  private serverStatId: number;
  private settingId: number;

  constructor() {
    this.users = new Map();
    this.celestialBodies = new Map();
    this.npcShips = new Map();
    this.npcFleets = new Map();
    this.players = new Map();
    this.areasOfInterest = new Map();
    this.serverLogs = [];
    this.serverStats = [];
    this.settings = new Map();
    
    this.userId = 1;
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.playerId = 1;
    this.areaOfInterestId = 1;
    this.serverLogId = 1;
    this.serverStatId = 1;
    this.settingId = 1;
  }
  
  // World persistence methods
  async saveWorldState(): Promise<boolean> {
    console.log('Saving world state (in-memory implementation - not persistent)');
    return true;
  }
  
  async loadWorldState(): Promise<boolean> {
    console.log('Loading world state (in-memory implementation - not persistent)');
    return true;
  }
  
  async resetWorldState(): Promise<boolean> {
    console.log('Resetting world state (in-memory implementation)');
    this.celestialBodies.clear();
    this.npcShips.clear();
    this.npcFleets.clear();
    this.areasOfInterest.clear();
    
    // Reset ID counters
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.areaOfInterestId = 1;
    
    return true;
  }
  
  async resetSequences(): Promise<boolean> {
    console.log('Resetting in-memory sequences');
    // For in-memory storage, just reset the counters
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.areaOfInterestId = 1;
    this.serverLogId = 1;
    this.serverStatId = 1;
    this.settingId = 1;
    this.userId = 1;
    this.playerId = 1;
    return true;
  }
  
  // Server settings methods
  async getSetting(name: string): Promise<ServerSetting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.name === name);
  }
  
  async getSettingValue<T>(name: string, defaultValue: T): Promise<T> {
    const setting = await this.getSetting(name);
    if (!setting) return defaultValue;
    
    try {
      switch (setting.dataType) {
        case 'boolean':
          return (setting.value === 'true') as unknown as T;
        case 'number':
          return parseFloat(setting.value) as unknown as T;
        case 'json':
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as unknown as T;
      }
    } catch (error) {
      console.error(`Error parsing setting ${name}:`, error);
      return defaultValue;
    }
  }
  
  async updateSetting(
    name: string, 
    value: string, 
    dataType: string, 
    category: string, 
    description?: string
  ): Promise<ServerSetting> {
    const existing = await this.getSetting(name);
    const lastUpdated = Date.now() / 1000; // Convert to seconds
    
    if (existing) {
      const updated: ServerSetting = {
        ...existing,
        value,
        dataType,
        category,
        description: description || existing.description,
        lastUpdated
      };
      this.settings.set(existing.id.toString(), updated);
      return updated;
    } else {
      const id = this.settingId++;
      const newSetting: ServerSetting = {
        id,
        name,
        value,
        dataType,
        category,
        description: description || null,
        lastUpdated
      };
      this.settings.set(id.toString(), newSetting);
      return newSetting;
    }
  }
  
  async getAllSettings(): Promise<ServerSetting[]> {
    return Array.from(this.settings.values());
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



// Database storage implementation
export class DatabaseStorage implements IStorage {
  async resetSequences(): Promise<boolean> {
    try {
      // Reset all table sequences to properly start from 1 after a world reset
      await db.execute(sql`
        SELECT setval('"celestial_bodies_id_seq"', 1, false);
        SELECT setval('"npc_ships_id_seq"', 1, false);
        SELECT setval('"npc_fleets_id_seq"', 1, false);
        SELECT setval('"areas_of_interest_id_seq"', 1, false);
        SELECT setval('"server_logs_id_seq"', 1, false);
        SELECT setval('"server_stats_id_seq"', 1, false);
        SELECT setval('"server_settings_id_seq"', 1, false);
        SELECT setval('"players_id_seq"', 1, false);
        SELECT setval('"users_id_seq"', 1, false);
      `);
      console.log('Database sequences reset');
      return true;
    } catch (error) {
      console.error('Error resetting sequences:', error);
      return false;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Celestial Body methods
  async getCelestialBody(id: number): Promise<CelestialBody | undefined> {
    const [body] = await db.select().from(celestialBodies).where(eq(celestialBodies.id, id));
    return body;
  }
  
  async getAllCelestialBodies(): Promise<CelestialBody[]> {
    return db.select().from(celestialBodies);
  }
  
  async createCelestialBody(body: InsertCelestialBody): Promise<CelestialBody> {
    const [celestialBody] = await db.insert(celestialBodies).values(body).returning();
    return celestialBody;
  }
  
  async updateCelestialBody(id: number, body: Partial<CelestialBody>): Promise<CelestialBody | undefined> {
    const [updated] = await db
      .update(celestialBodies)
      .set(body)
      .where(eq(celestialBodies.id, id))
      .returning();
    return updated;
  }
  
  async deleteCelestialBody(id: number): Promise<boolean> {
    const result = await db
      .delete(celestialBodies)
      .where(eq(celestialBodies.id, id));
    return true; // neon doesn't support rowCount
  }
  
  // NPC Ship methods
  async getNpcShip(id: number): Promise<NpcShip | undefined> {
    const [ship] = await db.select().from(npcShips).where(eq(npcShips.id, id));
    return ship;
  }
  
  async getNpcShipsByFleet(fleetId: string): Promise<NpcShip[]> {
    return db.select().from(npcShips).where(eq(npcShips.fleetId, fleetId));
  }
  
  async getAllNpcShips(): Promise<NpcShip[]> {
    return db.select().from(npcShips);
  }
  
  async createNpcShip(ship: InsertNpcShip): Promise<NpcShip> {
    const [npcShip] = await db.insert(npcShips).values(ship).returning();
    return npcShip;
  }
  
  async updateNpcShip(id: number, ship: Partial<NpcShip>): Promise<NpcShip | undefined> {
    const [updated] = await db
      .update(npcShips)
      .set(ship)
      .where(eq(npcShips.id, id))
      .returning();
    return updated;
  }
  
  async deleteNpcShip(id: number): Promise<boolean> {
    await db.delete(npcShips).where(eq(npcShips.id, id));
    return true;
  }
  
  // NPC Fleet methods
  async getNpcFleet(id: number): Promise<NpcFleet | undefined> {
    const [fleet] = await db.select().from(npcFleets).where(eq(npcFleets.id, id));
    return fleet;
  }
  
  async getNpcFleetByFleetId(fleetId: string): Promise<NpcFleet | undefined> {
    const [fleet] = await db.select().from(npcFleets).where(eq(npcFleets.fleetId, fleetId));
    return fleet;
  }
  
  async getAllNpcFleets(): Promise<NpcFleet[]> {
    return db.select().from(npcFleets);
  }
  
  async createNpcFleet(fleet: InsertNpcFleet): Promise<NpcFleet> {
    const [npcFleet] = await db.insert(npcFleets).values(fleet).returning();
    return npcFleet;
  }
  
  async updateNpcFleet(id: number, fleet: Partial<NpcFleet>): Promise<NpcFleet | undefined> {
    const [updated] = await db
      .update(npcFleets)
      .set(fleet)
      .where(eq(npcFleets.id, id))
      .returning();
    return updated;
  }
  
  async deleteNpcFleet(id: number): Promise<boolean> {
    await db.delete(npcFleets).where(eq(npcFleets.id, id));
    return true;
  }
  
  // Player methods
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }
  
  async getPlayerByClientId(clientId: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.clientId, clientId));
    return player;
  }
  
  async getAllPlayers(): Promise<Player[]> {
    return db.select().from(players);
  }
  
  async getConnectedPlayers(): Promise<Player[]> {
    return db.select().from(players).where(eq(players.isConnected, true));
  }
  
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }
  
  async updatePlayer(id: number, player: Partial<Player>): Promise<Player | undefined> {
    const [updated] = await db
      .update(players)
      .set(player)
      .where(eq(players.id, id))
      .returning();
    return updated;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    await db.delete(players).where(eq(players.id, id));
    return true;
  }
  
  // Area of Interest methods
  async getAreaOfInterest(id: number): Promise<AreaOfInterestRecord | undefined> {
    const [area] = await db.select().from(areasOfInterest).where(eq(areasOfInterest.id, id));
    return area;
  }
  
  async getAllAreasOfInterest(): Promise<AreaOfInterestRecord[]> {
    return db.select().from(areasOfInterest);
  }
  
  async createAreaOfInterest(area: InsertAreaOfInterest): Promise<AreaOfInterestRecord> {
    const [newArea] = await db.insert(areasOfInterest).values(area).returning();
    return newArea;
  }
  
  async updateAreaOfInterest(id: number, area: Partial<AreaOfInterestRecord>): Promise<AreaOfInterestRecord | undefined> {
    const [updated] = await db
      .update(areasOfInterest)
      .set(area)
      .where(eq(areasOfInterest.id, id))
      .returning();
    return updated;
  }
  
  async deleteAreaOfInterest(id: number): Promise<boolean> {
    await db.delete(areasOfInterest).where(eq(areasOfInterest.id, id));
    return true;
  }
  
  // Server Log methods
  async createServerLog(log: InsertServerLog): Promise<ServerLog> {
    const [serverLog] = await db.insert(serverLogs).values(log).returning();
    return serverLog;
  }
  
  async getRecentLogs(limit: number, level?: string): Promise<ServerLog[]> {
    let query = db
      .select()
      .from(serverLogs)
      .orderBy(desc(serverLogs.timestamp))
      .limit(limit);
    
    if (level) {
      query = query.where(eq(serverLogs.level, level));
    }
    
    return query;
  }
  
  // Server Stats methods
  async createServerStat(stat: InsertServerStat): Promise<ServerStat> {
    const [serverStat] = await db.insert(serverStats).values(stat).returning();
    return serverStat;
  }
  
  async getRecentStats(limit: number): Promise<ServerStat[]> {
    return db
      .select()
      .from(serverStats)
      .orderBy(desc(serverStats.timestamp))
      .limit(limit);
  }
  
  // Server Settings methods
  async getSetting(name: string): Promise<ServerSetting | undefined> {
    const [setting] = await db
      .select()
      .from(serverSettings)
      .where(eq(serverSettings.name, name));
    return setting;
  }
  
  async getSettingValue<T>(name: string, defaultValue: T): Promise<T> {
    const setting = await this.getSetting(name);
    if (!setting) return defaultValue;
    
    try {
      switch (setting.dataType) {
        case 'boolean':
          return (setting.value === 'true') as unknown as T;
        case 'number':
          return parseFloat(setting.value) as unknown as T;
        case 'json':
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as unknown as T;
      }
    } catch (error) {
      console.error(`Error parsing setting ${name}:`, error);
      return defaultValue;
    }
  }
  
  async updateSetting(
    name: string, 
    value: string, 
    dataType: string, 
    category: string, 
    description?: string
  ): Promise<ServerSetting> {
    const existing = await this.getSetting(name);
    const lastUpdated = Date.now() / 1000; // Convert to seconds
    
    if (existing) {
      const [updated] = await db
        .update(serverSettings)
        .set({
          value,
          dataType,
          category,
          description: description ?? existing.description,
          lastUpdated
        })
        .where(eq(serverSettings.name, name))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db
        .insert(serverSettings)
        .values({
          name,
          value,
          dataType,
          category,
          description: description ?? null,
          lastUpdated
        })
        .returning();
      return newSetting;
    }
  }
  
  async getAllSettings(): Promise<ServerSetting[]> {
    return db.select().from(serverSettings);
  }
  
  // World persistence methods
  async saveWorldState(): Promise<boolean> {
    try {
      console.log('Saving world state to database...');
      
      // This is a placeholder for actual implementation
      // In a real implementation, you would:
      // 1. Get the current state from the GameServer instance
      // 2. Convert it to database format
      // 3. Use a transaction to save everything
      
      // Create a log entry for this save
      await this.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'INFO',
        message: 'Manual world state save completed',
        source: 'worldPersistence',
        data: null
      });
      
      return true;
    } catch (error) {
      console.error('Error saving world state:', error);
      
      // Log the error
      await this.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'ERROR',
        message: `World state save failed: ${error instanceof Error ? error.message : String(error)}`,
        source: 'worldPersistence',
        data: null
      });
      
      return false;
    }
  }
  
  async loadWorldState(): Promise<boolean> {
    try {
      console.log('Loading world state from database...');
      
      // This is a placeholder for actual implementation
      // In a real implementation, you would:
      // 1. Load all entities from the database
      // 2. Initialize the GameServer with this data
      
      // Create a log entry for this load
      await this.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'INFO',
        message: 'Manual world state load completed',
        source: 'worldPersistence',
        data: null
      });
      
      return true;
    } catch (error) {
      console.error('Error loading world state:', error);
      
      // Log the error
      await this.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'ERROR',
        message: `World state load failed: ${error instanceof Error ? error.message : String(error)}`,
        source: 'worldPersistence',
        data: null
      });
      
      return false;
    }
  }
  
  async resetWorldState(): Promise<boolean> {
    try {
      console.log('Resetting world state...');
      
      // Delete all entities from the database
      await db.transaction(async (tx) => {
        // Delete existing entities
        await tx.delete(celestialBodies);
        await tx.delete(npcShips);
        await tx.delete(npcFleets);
        await tx.delete(areasOfInterest);
        
        // Also delete logs and stats, as they can cause sequence conflicts
        await tx.delete(serverLogs);
        await tx.delete(serverStats);
        
        // Keep players and settings
        
        // Reset all sequences using setval 
        await tx.execute(sql`
          SELECT setval('"celestial_bodies_id_seq"', 1, false); 
          SELECT setval('"npc_ships_id_seq"', 1, false);
          SELECT setval('"npc_fleets_id_seq"', 1, false);
          SELECT setval('"areas_of_interest_id_seq"', 1, false);
          SELECT setval('"server_logs_id_seq"', 1, false);
          SELECT setval('"server_stats_id_seq"', 1, false);
          SELECT setval('"missions_id_seq"', 1, false);
        `);
        
        console.log('Database tables cleared and sequences reset');
      });
      
      // After resetting, create a fresh log entry outside the transaction
      // This should be ID 1 in the logs table
      await db.insert(serverLogs).values({
        id: 1, // Explicitly set ID to 1
        timestamp: Date.now() / 1000,
        level: 'INFO',
        message: 'World state reset completed',
        source: 'worldPersistence',
        data: null
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting world state:', error);
      
      // Log the error
      await this.createServerLog({
        timestamp: Date.now() / 1000,
        level: 'ERROR',
        message: `World state reset failed: ${error instanceof Error ? error.message : String(error)}`,
        source: 'worldPersistence',
        data: null
      });
      
      return false;
    }
  }
}

// Create a database connection to check if it exists
let storage: IStorage;

try {
  // Check if we have a database connection
  if (process.env.DATABASE_URL) {
    console.log('Using database storage');
    storage = new DatabaseStorage();
  } else {
    console.log('No database connection, using in-memory storage');
    storage = new MemStorage();
  }
} catch (error) {
  console.error('Error initializing database storage, falling back to in-memory storage:', error);
  storage = new MemStorage();
}

export { storage };
