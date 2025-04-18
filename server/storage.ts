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
  ShipTemplate, InsertShipTemplate,
  SERVER_SETTINGS
} from '@shared/schema';
import { Vector3 } from '@shared/math';
import { AreaOfInterestState } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

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
  clearAllAreasOfInterest(): Promise<void>;
  
  // Server Logs
  createServerLog(log: InsertServerLog): Promise<ServerLog>;
  getRecentLogs(limit: number, level?: string): Promise<ServerLog[]>;
  
  // Server Stats
  createServerStat(stat: InsertServerStat): Promise<ServerStat>;
  getRecentStats(limit: number): Promise<ServerStat[]>;
  
  // Ship Templates
  getShipTemplate(id: number): Promise<ShipTemplate | undefined>;
  getShipTemplateByTemplateId(templateId: string): Promise<ShipTemplate | undefined>;
  getAllShipTemplates(): Promise<ShipTemplate[]>;
  createShipTemplate(template: InsertShipTemplate): Promise<ShipTemplate>;
  updateShipTemplate(id: number, template: Partial<ShipTemplate>): Promise<ShipTemplate | undefined>;
  deleteShipTemplate(id: number): Promise<boolean>;
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
  private shipTemplates: Map<number, ShipTemplate>;
  
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
  private shipTemplateId: number;

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
    this.shipTemplates = new Map();
    
    this.userId = 1;
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.playerId = 1;
    this.areaOfInterestId = 1;
    this.serverLogId = 1;
    this.serverStatId = 1;
    this.settingId = 1;
    this.shipTemplateId = 1;
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
    this.shipTemplateId = 1;
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
  
  async clearAllAreasOfInterest(): Promise<void> {
    this.areasOfInterest.clear();
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

  // Ship Template methods
  async getShipTemplate(id: number): Promise<ShipTemplate | undefined> {
    return this.shipTemplates.get(id);
  }
  
  async getShipTemplateByTemplateId(templateId: string): Promise<ShipTemplate | undefined> {
    return Array.from(this.shipTemplates.values()).find(
      (template) => template.templateId === templateId
    );
  }
  
  async getAllShipTemplates(): Promise<ShipTemplate[]> {
    return Array.from(this.shipTemplates.values());
  }
  
  async createShipTemplate(template: InsertShipTemplate): Promise<ShipTemplate> {
    const id = this.shipTemplateId++;
    const shipTemplate: ShipTemplate = { ...template, id };
    this.shipTemplates.set(id, shipTemplate);
    return shipTemplate;
  }
  
  async updateShipTemplate(id: number, template: Partial<ShipTemplate>): Promise<ShipTemplate | undefined> {
    const existing = this.shipTemplates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...template };
    this.shipTemplates.set(id, updated);
    return updated;
  }
  
  async deleteShipTemplate(id: number): Promise<boolean> {
    return this.shipTemplates.delete(id);
  }
}



// Json file storage implementation
export class JsonStorage implements IStorage {
  private dataDir: string;
  private users: Map<number, User>;
  private celestialBodies: Map<number, CelestialBody>;
  private npcShips: Map<number, NpcShip>;
  private npcFleets: Map<number, NpcFleet>;
  private players: Map<number, Player>;
  private areasOfInterest: Map<number, AreaOfInterestRecord>;
  private serverLogs: ServerLog[];
  private serverStats: ServerStat[];
  private settings: Map<string, ServerSetting>;
  private shipTemplates: Map<number, ShipTemplate>;
  
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
  private shipTemplateId: number;
  
  constructor() {
    this.dataDir = path.resolve('./data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      log(`Created data directory at ${this.dataDir}`, 'info');
    }
    
    // Initialize data structures
    this.users = new Map();
    this.celestialBodies = new Map();
    this.npcShips = new Map();
    this.npcFleets = new Map();
    this.players = new Map();
    this.areasOfInterest = new Map();
    this.serverLogs = [];
    this.serverStats = [];
    this.settings = new Map();
    this.shipTemplates = new Map();
    
    // Initialize ID counters
    this.userId = 1;
    this.celestialBodyId = 1;
    this.npcShipId = 1;
    this.npcFleetId = 1;
    this.playerId = 1;
    this.areaOfInterestId = 1;
    this.serverLogId = 1;
    this.serverStatId = 1;
    this.settingId = 1;
    this.shipTemplateId = 1;
    
    // Load data from disk if it exists
    this.loadDataFromDisk();
  }
  
  private getFilePath(entityType: string): string {
    return path.join(this.dataDir, `${entityType}.json`);
  }
  
  private saveDataToDisk(entityType: string, data: any): void {
    try {
      const filePath = this.getFilePath(entityType);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      log(`Error saving ${entityType} data to disk: ${error}`, 'error');
    }
  }
  
  private loadDataFromFile<T>(entityType: string): T | null {
    try {
      const filePath = this.getFilePath(entityType);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) as T;
      }
    } catch (error) {
      log(`Error loading ${entityType} data from disk: ${error}`, 'error');
    }
    return null;
  }
  
  private loadDataFromDisk(): void {
    // Load users
    const users = this.loadDataFromFile<User[]>('users');
    if (users) {
      users.forEach(user => {
        this.users.set(user.id, user);
        this.userId = Math.max(this.userId, user.id + 1);
      });
      log(`Loaded ${users.length} users from disk`, 'info');
    }
    
    // Load celestial bodies
    const celestialBodies = this.loadDataFromFile<CelestialBody[]>('celestialBodies');
    if (celestialBodies) {
      celestialBodies.forEach(body => {
        this.celestialBodies.set(body.id, body);
        this.celestialBodyId = Math.max(this.celestialBodyId, body.id + 1);
      });
      log(`Loaded ${celestialBodies.length} celestial bodies from disk`, 'info');
    }
    
    // Load NPC ships
    const npcShips = this.loadDataFromFile<NpcShip[]>('npcShips');
    if (npcShips) {
      npcShips.forEach(ship => {
        this.npcShips.set(ship.id, ship);
        this.npcShipId = Math.max(this.npcShipId, ship.id + 1);
      });
      log(`Loaded ${npcShips.length} NPC ships from disk`, 'info');
    }
    
    // Load NPC fleets
    const npcFleets = this.loadDataFromFile<NpcFleet[]>('npcFleets');
    if (npcFleets) {
      npcFleets.forEach(fleet => {
        this.npcFleets.set(fleet.id, fleet);
        this.npcFleetId = Math.max(this.npcFleetId, fleet.id + 1);
      });
      log(`Loaded ${npcFleets.length} NPC fleets from disk`, 'info');
    }
    
    // Load players
    const players = this.loadDataFromFile<Player[]>('players');
    if (players) {
      players.forEach(player => {
        this.players.set(player.id, player);
        this.playerId = Math.max(this.playerId, player.id + 1);
      });
      log(`Loaded ${players.length} players from disk`, 'info');
    }
    
    // Load areas of interest
    const aoi = this.loadDataFromFile<AreaOfInterestRecord[]>('areasOfInterest');
    if (aoi) {
      aoi.forEach(area => {
        this.areasOfInterest.set(area.id, area);
        this.areaOfInterestId = Math.max(this.areaOfInterestId, area.id + 1);
      });
      log(`Loaded ${aoi.length} areas of interest from disk`, 'info');
    }
    
    // Load server logs
    const logs = this.loadDataFromFile<ServerLog[]>('serverLogs');
    if (logs) {
      this.serverLogs = logs;
      if (logs.length > 0) {
        this.serverLogId = Math.max(...logs.map(log => log.id)) + 1;
      }
      log(`Loaded ${logs.length} server logs from disk`, 'info');
    }
    
    // Load server stats
    const stats = this.loadDataFromFile<ServerStat[]>('serverStats');
    if (stats) {
      this.serverStats = stats;
      if (stats.length > 0) {
        this.serverStatId = Math.max(...stats.map(stat => stat.id)) + 1;
      }
      log(`Loaded ${stats.length} server stats from disk`, 'info');
    }
    
    // Load settings
    const settings = this.loadDataFromFile<ServerSetting[]>('settings');
    if (settings) {
      settings.forEach(setting => {
        this.settings.set(setting.id.toString(), setting);
        this.settingId = Math.max(this.settingId, setting.id + 1);
      });
      log(`Loaded ${settings.length} server settings from disk`, 'info');
    }
    
    // Load ship templates
    const shipTemplates = this.loadDataFromFile<ShipTemplate[]>('shipTemplates');
    if (shipTemplates) {
      shipTemplates.forEach(template => {
        this.shipTemplates.set(template.id, template);
        this.shipTemplateId = Math.max(this.shipTemplateId, template.id + 1);
      });
      log(`Loaded ${shipTemplates.length} ship templates from disk`, 'info');
    }
  }
  
  async resetSequences(): Promise<boolean> {
    try {
      log('Resetting JSON storage sequences', 'info');
      
      // Get the maximum IDs from each storage
      const maxNpcShipId = this.npcShips.size > 0 ? Math.max(...this.npcShips.keys()) : 0;
      const maxNpcFleetId = this.npcFleets.size > 0 ? Math.max(...this.npcFleets.keys()) : 0;
      const maxCelestialBodyId = this.celestialBodies.size > 0 ? Math.max(...this.celestialBodies.keys()) : 0;
      const maxAreaOfInterestId = this.areasOfInterest.size > 0 ? Math.max(...this.areasOfInterest.keys()) : 0;
      const maxServerLogId = this.serverLogs.length > 0 ? Math.max(...this.serverLogs.map(log => log.id)) : 0;
      const maxServerStatId = this.serverStats.length > 0 ? Math.max(...this.serverStats.map(stat => stat.id)) : 0;
      
      // Reset the counters
      this.npcShipId = maxNpcShipId + 1;
      this.npcFleetId = maxNpcFleetId + 1;
      this.celestialBodyId = maxCelestialBodyId + 1;
      this.areaOfInterestId = maxAreaOfInterestId + 1;
      this.serverLogId = maxServerLogId + 1;
      this.serverStatId = maxServerStatId + 1;
      
      log('JSON sequences reset successfully', 'info');
      return true;
    } catch (error) {
      log(`Error resetting JSON sequences: ${error}`, 'error');
      return false;
    }
  }
  
  // World persistence methods
  async saveWorldState(): Promise<boolean> {
    try {
      log('Saving world state to JSON files...', 'info');
      
      // Save each entity type to its own file
      this.saveDataToDisk('users', Array.from(this.users.values()));
      this.saveDataToDisk('celestialBodies', Array.from(this.celestialBodies.values()));
      this.saveDataToDisk('npcShips', Array.from(this.npcShips.values()));
      this.saveDataToDisk('npcFleets', Array.from(this.npcFleets.values()));
      this.saveDataToDisk('players', Array.from(this.players.values()));
      this.saveDataToDisk('areasOfInterest', Array.from(this.areasOfInterest.values()));
      this.saveDataToDisk('serverLogs', this.serverLogs);
      this.saveDataToDisk('serverStats', this.serverStats);
      this.saveDataToDisk('settings', Array.from(this.settings.values()));
      this.saveDataToDisk('shipTemplates', Array.from(this.shipTemplates.values()));
      
      log('World state saved successfully', 'info');
      return true;
    } catch (error) {
      log(`Error saving world state: ${error}`, 'error');
      return false;
    }
  }
  
  async loadWorldState(): Promise<boolean> {
    try {
      log('Loading world state from JSON files...', 'info');
      this.loadDataFromDisk();
      log('World state loaded successfully', 'info');
      return true;
    } catch (error) {
      log(`Error loading world state: ${error}`, 'error');
      return false;
    }
  }
  
  async resetWorldState(): Promise<boolean> {
    try {
      log('Resetting world state (JSON implementation)', 'info');
      
      // Clear all data
      this.celestialBodies.clear();
      this.npcShips.clear();
      this.npcFleets.clear();
      this.areasOfInterest.clear();
      
      // Reset ID counters
      this.celestialBodyId = 1;
      this.npcShipId = 1;
      this.npcFleetId = 1;
      this.areaOfInterestId = 1;
      
      // Save cleared state to disk
      this.saveDataToDisk('celestialBodies', []);
      this.saveDataToDisk('npcShips', []);
      this.saveDataToDisk('npcFleets', []);
      this.saveDataToDisk('areasOfInterest', []);
      
      log('World state reset successfully', 'info');
      return true;
    } catch (error) {
      log(`Error resetting world state: ${error}`, 'error');
      return false;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.saveDataToDisk('users', Array.from(this.users.values()));
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
    this.saveDataToDisk('celestialBodies', Array.from(this.celestialBodies.values()));
    return celestialBody;
  }
  
  async updateCelestialBody(id: number, body: Partial<CelestialBody>): Promise<CelestialBody | undefined> {
    const existing = this.celestialBodies.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...body };
    this.celestialBodies.set(id, updated);
    this.saveDataToDisk('celestialBodies', Array.from(this.celestialBodies.values()));
    return updated;
  }
  
  async deleteCelestialBody(id: number): Promise<boolean> {
    const result = this.celestialBodies.delete(id);
    this.saveDataToDisk('celestialBodies', Array.from(this.celestialBodies.values()));
    return result;
  }
  
  // NPC Ship methods
  async getNpcShip(id: number): Promise<NpcShip | undefined> {
    return this.npcShips.get(id);
  }
  
  async getNpcShipsByFleet(fleetId: string): Promise<NpcShip[]> {
    return Array.from(this.npcShips.values()).filter(ship => ship.fleetId === fleetId);
  }
  
  async getAllNpcShips(): Promise<NpcShip[]> {
    return Array.from(this.npcShips.values());
  }
  
  async createNpcShip(ship: InsertNpcShip): Promise<NpcShip> {
    const id = this.npcShipId++;
    const npcShip: NpcShip = { ...ship, id };
    this.npcShips.set(id, npcShip);
    this.saveDataToDisk('npcShips', Array.from(this.npcShips.values()));
    return npcShip;
  }
  
  async updateNpcShip(id: number, ship: Partial<NpcShip>): Promise<NpcShip | undefined> {
    const existing = this.npcShips.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...ship };
    this.npcShips.set(id, updated);
    this.saveDataToDisk('npcShips', Array.from(this.npcShips.values()));
    return updated;
  }
  
  async deleteNpcShip(id: number): Promise<boolean> {
    const result = this.npcShips.delete(id);
    this.saveDataToDisk('npcShips', Array.from(this.npcShips.values()));
    return result;
  }
  
  // NPC Fleet methods
  async getNpcFleet(id: number): Promise<NpcFleet | undefined> {
    return this.npcFleets.get(id);
  }
  
  async getNpcFleetByFleetId(fleetId: string): Promise<NpcFleet | undefined> {
    return Array.from(this.npcFleets.values()).find(fleet => fleet.fleetId === fleetId);
  }
  
  async getAllNpcFleets(): Promise<NpcFleet[]> {
    return Array.from(this.npcFleets.values());
  }
  
  async createNpcFleet(fleet: InsertNpcFleet): Promise<NpcFleet> {
    const id = this.npcFleetId++;
    const npcFleet: NpcFleet = { ...fleet, id };
    this.npcFleets.set(id, npcFleet);
    this.saveDataToDisk('npcFleets', Array.from(this.npcFleets.values()));
    return npcFleet;
  }
  
  async updateNpcFleet(id: number, fleet: Partial<NpcFleet>): Promise<NpcFleet | undefined> {
    const existing = this.npcFleets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...fleet };
    this.npcFleets.set(id, updated);
    this.saveDataToDisk('npcFleets', Array.from(this.npcFleets.values()));
    return updated;
  }
  
  async deleteNpcFleet(id: number): Promise<boolean> {
    const result = this.npcFleets.delete(id);
    this.saveDataToDisk('npcFleets', Array.from(this.npcFleets.values()));
    return result;
  }
  
  // Player methods
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async getPlayerByClientId(clientId: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(player => player.clientId === clientId);
  }
  
  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }
  
  async getConnectedPlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.isConnected);
  }
  
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.playerId++;
    const newPlayer: Player = { ...player, id };
    this.players.set(id, newPlayer);
    this.saveDataToDisk('players', Array.from(this.players.values()));
    return newPlayer;
  }
  
  async updatePlayer(id: number, player: Partial<Player>): Promise<Player | undefined> {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...player };
    this.players.set(id, updated);
    this.saveDataToDisk('players', Array.from(this.players.values()));
    return updated;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    const result = this.players.delete(id);
    this.saveDataToDisk('players', Array.from(this.players.values()));
    return result;
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
    this.saveDataToDisk('areasOfInterest', Array.from(this.areasOfInterest.values()));
    return newArea;
  }
  
  async updateAreaOfInterest(id: number, area: Partial<AreaOfInterestRecord>): Promise<AreaOfInterestRecord | undefined> {
    const existing = this.areasOfInterest.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...area };
    this.areasOfInterest.set(id, updated);
    this.saveDataToDisk('areasOfInterest', Array.from(this.areasOfInterest.values()));
    return updated;
  }
  
  async deleteAreaOfInterest(id: number): Promise<boolean> {
    const result = this.areasOfInterest.delete(id);
    this.saveDataToDisk('areasOfInterest', Array.from(this.areasOfInterest.values()));
    return result;
  }
  
  async clearAllAreasOfInterest(): Promise<void> {
    this.areasOfInterest.clear();
    this.saveDataToDisk('areasOfInterest', []);
    log('Cleared all areas of interest', 'info');
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
    
    this.saveDataToDisk('serverLogs', this.serverLogs);
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
    
    this.saveDataToDisk('serverStats', this.serverStats);
    return serverStat;
  }
  
  async getRecentStats(limit: number): Promise<ServerStat[]> {
    // Sort by timestamp (descending)
    const stats = [...this.serverStats].sort((a, b) => b.timestamp - a.timestamp);
    
    // Return limited number
    return stats.slice(0, limit);
  }
  
  // Server Settings methods
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
      log(`Error parsing setting ${name}: ${error}`, 'error');
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
      this.saveDataToDisk('settings', Array.from(this.settings.values()));
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
      this.saveDataToDisk('settings', Array.from(this.settings.values()));
      return newSetting;
    }
  }
  
  async getAllSettings(): Promise<ServerSetting[]> {
    return Array.from(this.settings.values());
  }
  
  // Ship Template methods
  async getShipTemplate(id: number): Promise<ShipTemplate | undefined> {
    return this.shipTemplates.get(id);
  }
  
  async getShipTemplateByTemplateId(templateId: string): Promise<ShipTemplate | undefined> {
    return Array.from(this.shipTemplates.values()).find(
      (template) => template.templateId === templateId
    );
  }
  
  async getAllShipTemplates(): Promise<ShipTemplate[]> {
    return Array.from(this.shipTemplates.values());
  }
  
  async createShipTemplate(template: InsertShipTemplate): Promise<ShipTemplate> {
    const id = this.shipTemplateId++;
    const shipTemplate: ShipTemplate = { ...template, id };
    this.shipTemplates.set(id, shipTemplate);
    this.saveDataToDisk('shipTemplates', Array.from(this.shipTemplates.values()));
    return shipTemplate;
  }
  
  async updateShipTemplate(id: number, template: Partial<ShipTemplate>): Promise<ShipTemplate | undefined> {
    const existing = this.shipTemplates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...template };
    this.shipTemplates.set(id, updated);
    this.saveDataToDisk('shipTemplates', Array.from(this.shipTemplates.values()));
    return updated;
  }
  
  async deleteShipTemplate(id: number): Promise<boolean> {
    const result = this.shipTemplates.delete(id);
    this.saveDataToDisk('shipTemplates', Array.from(this.shipTemplates.values()));
    return result;
  }
}

// Create and export the storage instance
const storage = new JsonStorage();
console.log('Using JSON file storage');

export { storage, IStorage };
