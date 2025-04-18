# Celestial Simulation System

This document explains the orbital mechanics and celestial body simulation system used in Orbital Nexus.

## Overview

The Celestial Simulation System is responsible for accurately modeling celestial bodies (planets, moons, asteroids, and space stations) in a physically realistic way. The system implements Keplerian orbital mechanics to provide a scientifically accurate yet computationally efficient simulation of celestial motion.

## Celestial Body Types

The system supports several types of celestial bodies:

- **Stars**: Central bodies that other objects orbit around
- **Planets**: Major bodies that orbit stars
- **Moons**: Bodies that orbit planets
- **Asteroids**: Smaller bodies with various orbital patterns
- **Space Stations**: Artificial structures in orbit

## Orbital Mechanics

### Keplerian Elements

Each celestial body's orbit is defined by Keplerian orbital elements:

- **Semi-major Axis (a)**: Defines the size of the orbit
- **Eccentricity (e)**: Defines the shape of the orbit (0 = circular, >0 = elliptical)
- **Inclination (i)**: Tilt of the orbital plane relative to the reference plane
- **Longitude of Ascending Node (Ω)**: Orientation of the orbit in space
- **Argument of Periapsis (ω)**: Orientation of the orbit in the orbital plane
- **Mean Anomaly (M)**: Position of the body along the orbit at the epoch

### Position Calculation

The position of a celestial body at any given time is calculated using the following process:

1. Calculate the mean anomaly at the current time
2. Solve Kepler's equation to find the eccentric anomaly
3. Calculate the true anomaly
4. Determine the distance from the central body
5. Convert orbital elements to Cartesian coordinates

This process provides an accurate position for any celestial body at any point in time.

## Simulation Features

### Time Control

The simulation supports various time controls:

- **Real-time**: Simulation progresses at the same rate as real time
- **Accelerated**: Simulation runs faster than real time
- **Frozen**: Simulation is paused, with bodies remaining in fixed positions

The simulation speed can be adjusted through the `setSimulationSpeed` method.

### Frozen Mode

Frozen mode allows the celestial simulation to be paused while the rest of the game continues. This is useful for:

- Debugging and testing
- Creating stable environments for certain gameplay scenarios
- Reducing computational load when exact positions aren't critical

Frozen mode can be toggled with the `toggleFrozenMode` method.

## Celestial Body Properties

Each celestial body has various properties:

### Physical Properties
- **Mass**: Affects gravitational calculations
- **Radius**: Physical size of the body
- **Color**: Visual representation color

### Orbital Properties
- **Orbital Elements**: The Keplerian elements described above
- **Parent Body**: The body it orbits around (null for the central star)
- **Children**: Bodies that orbit this one (moons for planets, etc.)

### Additional Properties
- **Type**: The classification of the body (star, planet, moon, etc.)
- **Name**: Human-readable identifier
- **Description**: Additional information about the body

## API Methods

The Celestial Manager provides several key methods:

### Core Management
- `initialize()`: Set up the initial solar system
- `update()`: Update celestial positions based on elapsed time
- `getCurrentPositions()`: Get current positions of all bodies
- `calculateOrbitalProgress()`: Calculate the current orbital progress (0-1) of each body

### Body Manipulation
- `addBody(body)`: Add a new celestial body to the simulation
- `removeBody(id)`: Remove a body from the simulation
- `getAllBodies()`: Get all celestial bodies in the simulation
- `getBody(id)`: Get a specific celestial body by ID

### Simulation Control
- `setSimulationSpeed(speed)`: Set the simulation speed multiplier
- `getSimulationTime()`: Get the current simulation time
- `getSimulationSettings()`: Get the current simulation settings
- `toggleFrozenMode(frozen)`: Enable or disable frozen mode

## Default Solar System

The system initializes with a default solar system that includes:

- A central star (Sun)
- Multiple planets (Earth, Mars, Jupiter, etc.)
- Moons orbiting the planets
- Asteroid belts
- Space stations in various orbits

This default system provides a realistic starting point that can be modified as needed.

## Integration with Other Systems

### Area of Interest System
Celestial bodies are considered "always interesting" and are synchronized to all clients regardless of their location, ensuring a consistent view of the solar system.

### NPC System
NPCs interact with celestial bodies, including:
- Mining asteroids
- Orbiting planets
- Docking with space stations
- Using celestial bodies for navigation references

### Mission System
Missions often reference celestial bodies as:
- Destinations
- Reference points
- Mission objectives (e.g., survey a specific planet)

## Performance Considerations

The celestial simulation is optimized for performance:

- Positions are only calculated when needed
- Updates occur at a lower frequency (once per second) than the main game loop
- Broadcasts to clients happen even less frequently (every 5 seconds)
- Bodies very far from any player may be simulated at reduced precision

## Editing Celestial Bodies

Celestial bodies can be edited through the admin dashboard:

1. Navigate to the "Celestial Management" tab
2. Select a body to edit
3. Modify its properties
4. Save changes

When editing orbital parameters, the system automatically validates changes to ensure orbital stability. If parameters would result in an unstable orbit, the system will either reject the changes or suggest alternatives.

## Example: Adding a New Planet

```typescript
const newPlanet = {
  id: null, // Will be assigned by the system
  name: "New Planet",
  type: "planet",
  mass: 5.972e24, // kg
  radius: 6371, // km
  color: "#3366cc",
  
  // Orbital elements
  semiMajorAxis: 150000000, // km
  eccentricity: 0.0167,
  inclination: 0, // degrees
  longitudeOfAscendingNode: 0, // degrees
  argumentOfPeriapsis: 114.20783, // degrees
  meanAnomaly: 0, // degrees
  
  // Reference information
  parentId: 0, // The Sun's ID
  children: [], // No moons yet
};

await celestialManager.addBody(newPlanet);
```

## Visualization

The celestial system includes visualization support through:

- 2D Map View: Top-down view of the solar system
- 3D View: Three.js-based 3D visualization
- Orbital Path Display: Show the paths that bodies follow
- Time Controls: Adjust simulation speed in the visualization

## Technical Details

### Numerical Integration

While Keplerian orbits are used for most bodies, some special cases (like highly perturbed orbits) use numerical integration:

- **Euler Integration**: Simple, fast, but less accurate
- **Verlet Integration**: Better energy conservation
- **Runge-Kutta (RK4)**: High accuracy for complex cases

### Reference Frames

The system uses several reference frames:

- **Heliocentric Ecliptic**: Main reference frame centered on the star
- **Body-Centric**: Local reference frames for each major body
- **Cartesian Coordinates**: Used for final position representation

## Conclusion

The Celestial Simulation System provides a scientifically accurate, performant foundation for the space environment in Orbital Nexus. By combining Keplerian orbital mechanics with efficient implementation techniques, it creates a realistic and dynamic solar system for player exploration and gameplay.