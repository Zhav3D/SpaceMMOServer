import { pgTable, text, serial, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Celestial bodies (planets, moons, etc.)
export const celestialBodies = pgTable("celestial_bodies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // planet, moon, asteroid, etc.
  mass: real("mass").notNull(),
  radius: real("radius").notNull(),
  semiMajorAxis: real("semi_major_axis").notNull(), // orbital parameter
  eccentricity: real("eccentricity").notNull(), // orbital parameter
  inclination: real("inclination").notNull(), // orbital parameter
  longitudeOfAscendingNode: real("longitude_of_ascending_node").notNull(), // orbital parameter
  argumentOfPeriapsis: real("argument_of_periapsis").notNull(), // orbital parameter
  meanAnomaly: real("mean_anomaly").notNull(), // orbital parameter
  parentBodyId: integer("parent_body_id"), // null for the sun/star
  color: text("color").notNull(), // For visualization
});

export const insertCelestialBodySchema = createInsertSchema(celestialBodies).omit({
  id: true,
});

export type InsertCelestialBody = z.infer<typeof insertCelestialBodySchema>;
export type CelestialBody = typeof celestialBodies.$inferSelect;

// NPC ships
export const npcShips = pgTable("npc_ships", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // enemy, transport, civilian, mining
  status: text("status").notNull(), // hostile, en-route, passive, working
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  velocityX: real("velocity_x").notNull(),
  velocityY: real("velocity_y").notNull(),
  velocityZ: real("velocity_z").notNull(),
  rotationX: real("rotation_x").notNull(),
  rotationY: real("rotation_y").notNull(),
  rotationZ: real("rotation_z").notNull(),
  rotationW: real("rotation_w").notNull(),
  nearestCelestialBodyId: integer("nearest_celestial_body_id").notNull(),
  fleetId: text("fleet_id").notNull(),
  aiState: text("ai_state").notNull(), // patrolling, attacking, fleeing, mining, etc.
  targetId: text("target_id"), // ID of the target (if any)
});

export const insertNpcShipSchema = createInsertSchema(npcShips).omit({
  id: true,
});

export type InsertNpcShip = z.infer<typeof insertNpcShipSchema>;
export type NpcShip = typeof npcShips.$inferSelect;

// NPC Fleets (groups of NPC ships)
export const npcFleets = pgTable("npc_fleets", {
  id: serial("id").primaryKey(),
  fleetId: text("fleet_id").notNull().unique(),
  type: text("type").notNull(), // enemy, transport, civilian, mining
  status: text("status").notNull(), // hostile, en-route, passive, working
  count: integer("count").notNull(),
  location: text("location").notNull(), // human-readable location
  nearestCelestialBodyId: integer("nearest_celestial_body_id").notNull(),
});

export const insertNpcFleetSchema = createInsertSchema(npcFleets).omit({
  id: true,
});

export type InsertNpcFleet = z.infer<typeof insertNpcFleetSchema>;
export type NpcFleet = typeof npcFleets.$inferSelect;

// Players (connected clients)
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientId: text("client_id").notNull().unique(),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  velocityX: real("velocity_x").notNull(),
  velocityY: real("velocity_y").notNull(),
  velocityZ: real("velocity_z").notNull(),
  rotationX: real("rotation_x").notNull(),
  rotationY: real("rotation_y").notNull(),
  rotationZ: real("rotation_z").notNull(),
  rotationW: real("rotation_w").notNull(),
  nearestCelestialBodyId: integer("nearest_celestial_body_id").notNull(),
  lastUpdate: real("last_update").notNull(), // timestamp
  isConnected: boolean("is_connected").notNull().default(true),
  ipAddress: text("ip_address").notNull(),
  port: integer("port").notNull(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Areas of Interest (spatial partitioning)
export const areasOfInterest = pgTable("areas_of_interest", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  centerX: real("center_x").notNull(),
  centerY: real("center_y").notNull(),
  centerZ: real("center_z").notNull(),
  radius: real("radius").notNull(),
  nearestCelestialBodyId: integer("nearest_celestial_body_id"),
  playerCount: integer("player_count").notNull().default(0),
  npcCount: integer("npc_count").notNull().default(0),
  updateFrequency: integer("update_frequency").notNull().default(60), // in Hz
  latency: real("latency").notNull().default(0), // in ms
  load: real("load").notNull().default(0), // 0-100%
  capacityLimit: integer("capacity_limit").notNull().default(400),
});

export const insertAreaOfInterestSchema = createInsertSchema(areasOfInterest).omit({
  id: true,
});

export type InsertAreaOfInterest = z.infer<typeof insertAreaOfInterestSchema>;
export type AreaOfInterest = typeof areasOfInterest.$inferSelect;

// Server logs
export const serverLogs = pgTable("server_logs", {
  id: serial("id").primaryKey(),
  timestamp: real("timestamp").notNull(),
  level: text("level").notNull(), // INFO, WARN, ERROR
  message: text("message").notNull(),
  source: text("source"), // component that generated the log
  data: jsonb("data"), // additional data in JSON format
});

export const insertServerLogSchema = createInsertSchema(serverLogs).omit({
  id: true,
});

export type InsertServerLog = z.infer<typeof insertServerLogSchema>;
export type ServerLog = typeof serverLogs.$inferSelect;

// Server stats
export const serverStats = pgTable("server_stats", {
  id: serial("id").primaryKey(),
  timestamp: real("timestamp").notNull(),
  cpuLoad: real("cpu_load").notNull(), // percentage
  memoryUsage: real("memory_usage").notNull(), // MB
  networkTraffic: real("network_traffic").notNull(), // MB/s
  playerCount: integer("player_count").notNull(),
});

export const insertServerStatSchema = createInsertSchema(serverStats).omit({
  id: true,
});

export type InsertServerStat = z.infer<typeof insertServerStatSchema>;
export type ServerStat = typeof serverStats.$inferSelect;
