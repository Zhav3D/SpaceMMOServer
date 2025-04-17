import { CelestialBody, CelestialBodyState } from '@shared/types';
import { MessageType } from '@shared/types';
import { UDPServer } from './udp';
import { storage } from './storage';
import { Vector3 } from '@shared/math';
import { updateCelestialBodyPosition } from '@shared/physics';

// Simulation settings
export interface CelestialSimulationSettings {
  simulationSpeed: number; // How many real seconds per simulation second
  centralBodyMass: number; // Mass of the central body (sun) in kg
  initialTime: number; // Initial simulation time
}

// Celestial body simulation manager
export class CelestialManager {
  private udpServer: UDPServer;
  private bodies: Map<number, CelestialBody> = new Map();
  private simulationTime: number; // Current simulation time in seconds
  private lastUpdateTime: number; // Last real-time update in milliseconds
  private simulationSettings: CelestialSimulationSettings;
  
  constructor(
    udpServer: UDPServer,
    settings: CelestialSimulationSettings = {
      simulationSpeed: 10.0, // 10x speed by default
      centralBodyMass: 1.989e30, // Sun's mass in kg
      initialTime: 0
    }
  ) {
    this.udpServer = udpServer;
    this.simulationSettings = settings;
    this.simulationTime = settings.initialTime;
    this.lastUpdateTime = Date.now();
  }
  
  // Initialize the celestial manager
  async initialize(): Promise<void> {
    try {
      // Load all celestial bodies from storage
      const bodies = await storage.getAllCelestialBodies();
      
      for (const body of bodies) {
        this.bodies.set(body.id, body);
      }
      
      console.log(`Initialized celestial simulator with ${bodies.length} bodies`);
      
      // If no bodies exist, create a default solar system
      if (bodies.length === 0) {
        await this.createDefaultSolarSystem();
      }
    } catch (error) {
      console.error('Failed to initialize celestial bodies:', error);
    }
  }
  
  // Create a default solar system with major planets
  // Use scaled-down parameters for more visible movement
  private async createDefaultSolarSystem(): Promise<void> {
    console.log('Creating default solar system...');
    
    try {
      // We'll use a scaled system with much smaller distances and higher masses
      // to make orbital periods much shorter (more visible movement)
      const scaleFactor = 0.01; // Scale distances to 1% of actual
      const massMultiplier = 10.0; // Increase mass to speed up orbits
      
      // Sun (central body)
      const sun = await storage.createCelestialBody({
        name: 'Sun',
        type: 'star',
        mass: this.simulationSettings.centralBodyMass * massMultiplier,
        radius: 695700000, // Sun radius in meters
        semiMajorAxis: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        parentBodyId: null,
        color: '#ffcc00'
      });
      
      this.bodies.set(sun.id, sun);
      
      // Mercury
      const mercury = await storage.createCelestialBody({
        name: 'Mercury',
        type: 'planet',
        mass: 3.3011e23,
        radius: 2439700,
        semiMajorAxis: 57909050000 * scaleFactor,
        eccentricity: 0.20563,
        inclination: 7.005 * Math.PI / 180,
        longitudeOfAscendingNode: 48.331 * Math.PI / 180,
        argumentOfPeriapsis: 29.124 * Math.PI / 180,
        meanAnomaly: 174.796 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#b5b5b5'
      });
      
      this.bodies.set(mercury.id, mercury);
      
      // Venus
      const venus = await storage.createCelestialBody({
        name: 'Venus',
        type: 'planet',
        mass: 4.8675e24,
        radius: 6051800,
        semiMajorAxis: 108208000000 * scaleFactor,
        eccentricity: 0.00677,
        inclination: 3.39458 * Math.PI / 180,
        longitudeOfAscendingNode: 76.68 * Math.PI / 180,
        argumentOfPeriapsis: 54.884 * Math.PI / 180,
        meanAnomaly: 50.115 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#e6e6e6'
      });
      
      this.bodies.set(venus.id, venus);
      
      // Earth
      const earth = await storage.createCelestialBody({
        name: 'Earth',
        type: 'planet',
        mass: 5.97237e24,
        radius: 6371000,
        semiMajorAxis: 149598023000 * scaleFactor,
        eccentricity: 0.0167086,
        inclination: 0.00005 * Math.PI / 180,
        longitudeOfAscendingNode: -11.26064 * Math.PI / 180,
        argumentOfPeriapsis: 114.20783 * Math.PI / 180,
        meanAnomaly: 358.617 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#3498db'
      });
      
      this.bodies.set(earth.id, earth);
      
      // Moon
      const moon = await storage.createCelestialBody({
        name: 'Moon',
        type: 'moon',
        mass: 7.342e22,
        radius: 1737400,
        semiMajorAxis: 384748000 * scaleFactor * 10, // Scale up a bit more for visibility
        eccentricity: 0.0549,
        inclination: 5.145 * Math.PI / 180,
        longitudeOfAscendingNode: 125.08 * Math.PI / 180,
        argumentOfPeriapsis: 318.15 * Math.PI / 180,
        meanAnomaly: 115.3654 * Math.PI / 180,
        parentBodyId: earth.id,
        color: '#d0d0d0'
      });
      
      this.bodies.set(moon.id, moon);
      
      // Mars
      const mars = await storage.createCelestialBody({
        name: 'Mars',
        type: 'planet',
        mass: 6.4171e23,
        radius: 3389500,
        semiMajorAxis: 227939200000 * scaleFactor,
        eccentricity: 0.0934,
        inclination: 1.85 * Math.PI / 180,
        longitudeOfAscendingNode: 49.558 * Math.PI / 180,
        argumentOfPeriapsis: 286.502 * Math.PI / 180,
        meanAnomaly: 19.373 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#e74c3c'
      });
      
      this.bodies.set(mars.id, mars);
      
      // Mars moon - Phobos
      const phobos = await storage.createCelestialBody({
        name: 'Phobos',
        type: 'moon',
        mass: 1.0659e16,
        radius: 11266,
        semiMajorAxis: 9376000 * scaleFactor * 15, // Scale up for visibility
        eccentricity: 0.0151,
        inclination: 1.093 * Math.PI / 180,
        longitudeOfAscendingNode: 16.946 * Math.PI / 180,
        argumentOfPeriapsis: 157.116 * Math.PI / 180,
        meanAnomaly: 150.057 * Math.PI / 180,
        parentBodyId: mars.id,
        color: '#8B4513'
      });
      
      this.bodies.set(phobos.id, phobos);
      
      // Jupiter
      const jupiter = await storage.createCelestialBody({
        name: 'Jupiter',
        type: 'planet',
        mass: 1.8982e27,
        radius: 69911000,
        semiMajorAxis: 778570200000 * scaleFactor,
        eccentricity: 0.0489,
        inclination: 1.303 * Math.PI / 180,
        longitudeOfAscendingNode: 100.464 * Math.PI / 180,
        argumentOfPeriapsis: 273.867 * Math.PI / 180,
        meanAnomaly: 20.02 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#f39c12'
      });
      
      this.bodies.set(jupiter.id, jupiter);
      
      // Europa (Jupiter's moon)
      const europa = await storage.createCelestialBody({
        name: 'Europa',
        type: 'moon',
        mass: 4.8e22,
        radius: 1560800,
        semiMajorAxis: 670900000 * scaleFactor * 10, // Scale up for visibility
        eccentricity: 0.009,
        inclination: 0.47 * Math.PI / 180,
        longitudeOfAscendingNode: 101.4 * Math.PI / 180,
        argumentOfPeriapsis: 120.5 * Math.PI / 180,
        meanAnomaly: 200.0 * Math.PI / 180,
        parentBodyId: jupiter.id,
        color: '#f5f5dc'
      });
      
      this.bodies.set(europa.id, europa);
      
      // Saturn
      const saturn = await storage.createCelestialBody({
        name: 'Saturn',
        type: 'planet',
        mass: 5.6834e26,
        radius: 58232000,
        semiMajorAxis: 1433530000000 * scaleFactor,
        eccentricity: 0.0565,
        inclination: 2.485 * Math.PI / 180,
        longitudeOfAscendingNode: 113.665 * Math.PI / 180,
        argumentOfPeriapsis: 339.392 * Math.PI / 180,
        meanAnomaly: 317.02 * Math.PI / 180,
        parentBodyId: sun.id,
        color: '#f1c40f'
      });
      
      this.bodies.set(saturn.id, saturn);
      
      // Titan (Saturn's moon)
      const titan = await storage.createCelestialBody({
        name: 'Titan',
        type: 'moon',
        mass: 1.3452e23,
        radius: 2574730,
        semiMajorAxis: 1221870000 * scaleFactor * 10, // Scale up for visibility
        eccentricity: 0.0288,
        inclination: 0.34854 * Math.PI / 180,
        longitudeOfAscendingNode: 28.06 * Math.PI / 180,
        argumentOfPeriapsis: 180.532 * Math.PI / 180,
        meanAnomaly: 175.83 * Math.PI / 180,
        parentBodyId: saturn.id,
        color: '#E49B0F'
      });
      
      this.bodies.set(titan.id, titan);
      
      // Add a space station near Earth
      const iss = await storage.createCelestialBody({
        name: 'Alpha Station',
        type: 'station',
        mass: 5e5, // 500 tons
        radius: 100, // 100m
        semiMajorAxis: 6771000 * scaleFactor * 15, // Low Earth orbit, scaled
        eccentricity: 0.0002,
        inclination: 0.904 * Math.PI / 180,
        longitudeOfAscendingNode: 0.0 * Math.PI / 180,
        argumentOfPeriapsis: 0.0 * Math.PI / 180,
        meanAnomaly: 0.0 * Math.PI / 180,
        parentBodyId: earth.id,
        color: '#ffffff'
      });
      
      this.bodies.set(iss.id, iss);
      
      console.log('Default solar system created');
    } catch (error) {
      console.error('Failed to create default solar system:', error);
    }
  }
  
  // Update the simulation
  update(): void {
    const now = Date.now();
    const deltaTimeMs = now - this.lastUpdateTime;
    
    // Convert to simulation time
    const deltaSimTime = (deltaTimeMs / 1000) * this.simulationSettings.simulationSpeed;
    
    // Update simulation time
    this.simulationTime += deltaSimTime;
    this.lastUpdateTime = now;
  }
  
  // Get current positions of all celestial bodies
  getCurrentPositions(): Map<number, { position: Vector3, velocity: Vector3 }> {
    const positions = new Map<number, { position: Vector3, velocity: Vector3 }>();
    
    for (const [id, body] of this.bodies.entries()) {
      // Skip the central body (sun)
      if (!body.parentBodyId) {
        positions.set(id, { 
          position: new Vector3(0, 0, 0), 
          velocity: new Vector3(0, 0, 0) 
        });
        continue;
      }
      
      // Get parent body mass
      const parentBody = this.bodies.get(body.parentBodyId);
      const parentMass = parentBody ? parentBody.mass : this.simulationSettings.centralBodyMass;
      
      // Calculate position using orbital parameters
      const result = updateCelestialBodyPosition(body, parentMass, this.simulationTime);
      positions.set(id, result);
    }
    
    return positions;
  }
  
  // Calculate the orbital progress (0-1) for each body
  calculateOrbitalProgress(): Map<number, number> {
    const progress = new Map<number, number>();
    
    for (const [id, body] of this.bodies.entries()) {
      // Skip the central body
      if (!body.parentBodyId) {
        progress.set(id, 0);
        continue;
      }
      
      // Calculate orbital period
      const parentBody = this.bodies.get(body.parentBodyId);
      const parentMass = parentBody ? parentBody.mass : this.simulationSettings.centralBodyMass;
      
      // T^2 = (4π^2 * a^3) / (G * M)
      const G = 6.67430e-11; // Gravitational constant
      const a = body.semiMajorAxis;
      
      const orbitalPeriod = 2 * Math.PI * Math.sqrt(a * a * a / (G * parentMass));
      
      // Calculate current progress as a fraction of the orbital period
      // Adjust for mean anomaly starting point
      const currentAngle = (this.simulationTime / orbitalPeriod) * 2 * Math.PI + body.meanAnomaly;
      const normalizedAngle = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentProgress = normalizedAngle / (2 * Math.PI);
      
      progress.set(id, currentProgress);
    }
    
    return progress;
  }
  
  // Send celestial updates to clients
  sendCelestialUpdates(clientId?: string): void {
    // Get current positions
    const positions = this.getCurrentPositions();
    
    // Calculate orbital progress
    const orbitalProgress = this.calculateOrbitalProgress();
    
    // Convert to network format
    const bodies: CelestialBodyState[] = Array.from(this.bodies.entries()).map(([id, body]) => {
      const posVel = positions.get(id) || { 
        position: new Vector3(0, 0, 0), 
        velocity: new Vector3(0, 0, 0) 
      };
      
      return {
        id,
        name: body.name,
        type: body.type,
        position: posVel.position,
        velocity: posVel.velocity,
        radius: body.radius,
        mass: body.mass,
        orbitProgress: orbitalProgress.get(id) || 0,
        color: body.color
      };
    });
    
    // Create message
    const message = {
      messageType: MessageType.SERVER_CELESTIAL_UPDATE,
      sequence: 0, // Will be set by UDP server
      timestamp: Date.now(),
      clientId: clientId || '',
      bodies,
      simulationTime: this.simulationTime
    };
    
    // Send to specific client or broadcast
    if (clientId) {
      this.udpServer.sendToClient(clientId, message);
    } else {
      this.udpServer.sendToAll(message);
    }
  }
  
  // Add a new celestial body
  async addBody(body: CelestialBody): Promise<CelestialBody> {
    const newBody = await storage.createCelestialBody(body);
    this.bodies.set(newBody.id, newBody);
    return newBody;
  }
  
  // Remove a celestial body
  async removeBody(id: number): Promise<boolean> {
    const removed = await storage.deleteCelestialBody(id);
    
    if (removed) {
      this.bodies.delete(id);
    }
    
    return removed;
  }
  
  // Get all celestial bodies
  getAllBodies(): CelestialBody[] {
    return Array.from(this.bodies.values());
  }
  
  // Get a specific body
  getBody(id: number): CelestialBody | undefined {
    return this.bodies.get(id);
  }
  
  // Set simulation speed
  setSimulationSpeed(speed: number): void {
    this.simulationSettings.simulationSpeed = speed;
  }
  
  // Get current simulation time
  getSimulationTime(): number {
    return this.simulationTime;
  }
  
  // Get simulation settings
  getSimulationSettings(): CelestialSimulationSettings {
    return { ...this.simulationSettings };
  }
}
