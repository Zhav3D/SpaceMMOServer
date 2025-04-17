import { Vector3 } from './math';
import { CelestialBody } from './schema';

// Gravitational constant (G)
export const G = 6.67430e-11; // N⋅m²/kg²

// For solar system scale simulations, we might need to use a scale factor
// to avoid numerical precision issues
export const SCALE_FACTOR = 1.0e9; // Scale distances by 10^9 meters (1000 km units)
export const TIME_FACTOR = 1.0; // Scale time by 1.0 (real-time)

// Convert actual position to scaled position
export function toScaledPosition(position: Vector3): Vector3 {
  return new Vector3(
    position.x / SCALE_FACTOR,
    position.y / SCALE_FACTOR,
    position.z / SCALE_FACTOR
  );
}

// Convert scaled position to actual position
export function fromScaledPosition(position: Vector3): Vector3 {
  return new Vector3(
    position.x * SCALE_FACTOR,
    position.y * SCALE_FACTOR,
    position.z * SCALE_FACTOR
  );
}

// Calculate gravitational force between two bodies
export function calculateGravitationalForce(
  mass1: number, 
  mass2: number, 
  position1: Vector3, 
  position2: Vector3
): Vector3 {
  const direction = position2.subtract(position1);
  const distance = direction.magnitude();
  
  // Avoid division by zero
  if (distance < 1e-10) {
    return Vector3.zero();
  }
  
  const forceMagnitude = (G * mass1 * mass2) / (distance * distance);
  return direction.normalize().multiply(forceMagnitude);
}

// Calculate the orbital parameters
export interface OrbitalParameters {
  semiMajorAxis: number;       // a
  eccentricity: number;        // e
  inclination: number;         // i (radians)
  longitudeOfAscendingNode: number; // Ω (radians)
  argumentOfPeriapsis: number; // ω (radians)
  meanAnomaly: number;         // M (radians)
}

// Calculate position from orbital parameters at a given time
export function calculatePositionFromOrbitalElements(
  orbitalParams: OrbitalParameters,
  centralBodyMass: number,
  time: number
): Vector3 {
  const {
    semiMajorAxis,
    eccentricity,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
    meanAnomaly
  } = orbitalParams;

  // Calculate mean motion (n) - radians per second
  const mu = G * centralBodyMass;
  const meanMotion = Math.sqrt(mu / (semiMajorAxis * semiMajorAxis * semiMajorAxis));
  
  // Calculate current mean anomaly at given time
  const M = meanAnomaly + meanMotion * time;
  
  // Solve Kepler's equation for the eccentric anomaly (E)
  // M = E - e * sin(E)
  let E = M; // Initial guess
  
  // Newton-Raphson method to solve for E
  for (let i = 0; i < 10; i++) {
    const deltaE = (M - (E - eccentricity * Math.sin(E))) / (1 - eccentricity * Math.cos(E));
    E += deltaE;
    if (Math.abs(deltaE) < 1e-10) break;
  }
  
  // Calculate position in orbital plane
  const x = semiMajorAxis * (Math.cos(E) - eccentricity);
  const y = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
  
  // Rotate to 3D space based on orbital elements
  const cosΩ = Math.cos(longitudeOfAscendingNode);
  const sinΩ = Math.sin(longitudeOfAscendingNode);
  const cosω = Math.cos(argumentOfPeriapsis);
  const sinω = Math.sin(argumentOfPeriapsis);
  const cosi = Math.cos(inclination);
  const sini = Math.sin(inclination);
  
  // Rotation matrix elements
  const posX = (cosΩ * cosω - sinΩ * sinω * cosi) * x + (-cosΩ * sinω - sinΩ * cosω * cosi) * y;
  const posY = (sinΩ * cosω + cosΩ * sinω * cosi) * x + (-sinΩ * sinω + cosΩ * cosω * cosi) * y;
  const posZ = (sinω * sini) * x + (cosω * sini) * y;
  
  return new Vector3(posX, posY, posZ);
}

// Calculate velocity from orbital parameters at a given time
export function calculateVelocityFromOrbitalElements(
  orbitalParams: OrbitalParameters,
  centralBodyMass: number,
  time: number
): Vector3 {
  const {
    semiMajorAxis,
    eccentricity,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
    meanAnomaly
  } = orbitalParams;

  // Calculate mean motion (n) - radians per second
  const mu = G * centralBodyMass;
  const meanMotion = Math.sqrt(mu / (semiMajorAxis * semiMajorAxis * semiMajorAxis));
  
  // Calculate current mean anomaly at given time
  const M = meanAnomaly + meanMotion * time;
  
  // Solve Kepler's equation for the eccentric anomaly (E)
  let E = M; // Initial guess
  
  // Newton-Raphson method to solve for E
  for (let i = 0; i < 10; i++) {
    const deltaE = (M - (E - eccentricity * Math.sin(E))) / (1 - eccentricity * Math.cos(E));
    E += deltaE;
    if (Math.abs(deltaE) < 1e-10) break;
  }
  
  // Calculate the true anomaly (θ)
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const trueAnomaly = Math.atan2(
    Math.sqrt(1 - eccentricity * eccentricity) * sinE,
    cosE - eccentricity
  );
  
  // Calculate distance from focus to orbiting body
  const r = semiMajorAxis * (1 - eccentricity * cosE);
  
  // Calculate velocity components in orbital plane
  const p = semiMajorAxis * (1 - eccentricity * eccentricity);
  const velocityFactor = Math.sqrt(mu / p);
  
  const vx = -velocityFactor * Math.sin(trueAnomaly);
  const vy = velocityFactor * (eccentricity + Math.cos(trueAnomaly));
  
  // Rotate to 3D space based on orbital elements
  const cosΩ = Math.cos(longitudeOfAscendingNode);
  const sinΩ = Math.sin(longitudeOfAscendingNode);
  const cosω = Math.cos(argumentOfPeriapsis);
  const sinω = Math.sin(argumentOfPeriapsis);
  const cosi = Math.cos(inclination);
  const sini = Math.sin(inclination);
  
  // Rotation matrix elements
  const velX = (cosΩ * cosω - sinΩ * sinω * cosi) * vx + (-cosΩ * sinω - sinΩ * cosω * cosi) * vy;
  const velY = (sinΩ * cosω + cosΩ * sinω * cosi) * vx + (-sinΩ * sinω + cosΩ * cosω * cosi) * vy;
  const velZ = (sinω * sini) * vx + (cosω * sini) * vy;
  
  return new Vector3(velX, velY, velZ);
}

// Get orbital parameters from current position and velocity
export function calculateOrbitalElements(
  position: Vector3,
  velocity: Vector3,
  centralBodyMass: number
): OrbitalParameters {
  const mu = G * centralBodyMass;
  
  // Calculate angular momentum vector
  const h = position.cross(velocity);
  const hMag = h.magnitude();
  
  // Calculate eccentricity vector
  const v2 = velocity.sqrMagnitude();
  const r = position.magnitude();
  
  const eVec = position.multiply(v2 - mu / r).subtract(velocity.multiply(position.dot(velocity))).divide(mu);
  const eccentricity = eVec.magnitude();
  
  // Calculate inclination
  const inclination = Math.acos(h.z / hMag);
  
  // Calculate node line (n)
  const n = new Vector3(-h.y, h.x, 0);
  const nMag = n.magnitude();
  
  // Calculate longitude of ascending node
  let longitudeOfAscendingNode;
  if (nMag < 1e-10) {
    // For equatorial orbits, set to 0
    longitudeOfAscendingNode = 0;
  } else {
    longitudeOfAscendingNode = Math.acos(n.x / nMag);
    if (n.y < 0) {
      longitudeOfAscendingNode = 2 * Math.PI - longitudeOfAscendingNode;
    }
  }
  
  // Calculate argument of periapsis
  let argumentOfPeriapsis;
  if (nMag < 1e-10) {
    // For equatorial orbits, measure from x-axis
    argumentOfPeriapsis = Math.atan2(eVec.y, eVec.x);
  } else if (eccentricity < 1e-10) {
    // For circular orbits, set to 0
    argumentOfPeriapsis = 0;
  } else {
    const cosω = eVec.dot(n) / (eccentricity * nMag);
    argumentOfPeriapsis = Math.acos(Math.max(-1, Math.min(1, cosω)));
    if (eVec.z < 0) {
      argumentOfPeriapsis = 2 * Math.PI - argumentOfPeriapsis;
    }
  }
  
  // Calculate specific energy
  const energy = v2 / 2 - mu / r;
  
  // Calculate semi-major axis
  let semiMajorAxis;
  if (Math.abs(eccentricity - 1) < 1e-10) {
    // Parabolic orbit
    semiMajorAxis = Infinity;
  } else {
    semiMajorAxis = -mu / (2 * energy);
  }
  
  // Calculate true anomaly
  const trueAnomaly = Math.acos(eVec.dot(position) / (eccentricity * r));
  if (position.dot(velocity) < 0) {
    // If object is moving toward periapsis
    trueAnomaly = 2 * Math.PI - trueAnomaly;
  }
  
  // Calculate eccentric anomaly
  let E;
  if (eccentricity < 1) {
    // Elliptical orbit
    E = Math.atan2(
      Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(trueAnomaly),
      eccentricity + Math.cos(trueAnomaly)
    );
  } else {
    // Hyperbolic orbit
    E = Math.asinh(Math.sin(trueAnomaly) * Math.sqrt(eccentricity * eccentricity - 1) / (1 + eccentricity * Math.cos(trueAnomaly)));
  }
  
  // Calculate mean anomaly
  const meanAnomaly = E - eccentricity * Math.sin(E);
  
  return {
    semiMajorAxis,
    eccentricity,
    inclination,
    longitudeOfAscendingNode,
    argumentOfPeriapsis,
    meanAnomaly
  };
}

// Function to update orbital position for a celestial body
export function updateCelestialBodyPosition(
  body: CelestialBody,
  centralBodyMass: number,
  time: number
): { position: Vector3, velocity: Vector3 } {
  const orbitalParams: OrbitalParameters = {
    semiMajorAxis: body.semiMajorAxis,
    eccentricity: body.eccentricity,
    inclination: body.inclination,
    longitudeOfAscendingNode: body.longitudeOfAscendingNode,
    argumentOfPeriapsis: body.argumentOfPeriapsis,
    meanAnomaly: body.meanAnomaly
  };
  
  const position = calculatePositionFromOrbitalElements(orbitalParams, centralBodyMass, time);
  const velocity = calculateVelocityFromOrbitalElements(orbitalParams, centralBodyMass, time);
  
  return { position, velocity };
}
