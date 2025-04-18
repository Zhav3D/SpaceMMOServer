# Orbital Nexus Documentation

Welcome to the Orbital Nexus documentation. This guide will help you understand the architecture, systems, and components of the Orbital Nexus Space MMO Server.

## Core Systems

| System | Description | Link |
|--------|-------------|------|
| Server Architecture | Overview of the server architecture and components | [README.md](../README.md) |
| Celestial Simulation | Orbital mechanics and celestial body simulation | [CELESTIAL_SIMULATION.md](CELESTIAL_SIMULATION.md) |
| NPC System | AI-controlled ships and fleet management | [NPC_SYSTEM.md](NPC_SYSTEM.md) |
| Area of Interest | Efficient state replication for vast spaces | [AREA_OF_INTEREST.md](AREA_OF_INTEREST.md) |
| Mission System | Dynamic mission generation and management | [MISSION_SYSTEM.md](MISSION_SYSTEM.md) |
| Ship Templates | Customizable ship configurations | [SHIP_EDITOR_GUIDE.md](SHIP_EDITOR_GUIDE.md) |

## Contributing

If you're interested in contributing to Orbital Nexus, please read our [contribution guidelines](../CONTRIBUTING.md).

## Directory Structure

```
orbital-nexus/
├── client/ - Admin dashboard frontend
│   └── src/
│       ├── components/ - React components
│       ├── contexts/ - React contexts
│       ├── hooks/ - Custom React hooks
│       ├── lib/ - Utility functions
│       └── pages/ - Dashboard pages
├── server/ - Backend server code
│   ├── aoi.ts - Area of Interest management
│   ├── celestial.ts - Celestial body simulation
│   ├── index.ts - Server entry point
│   ├── mission.ts - Mission system
│   ├── npc.ts - NPC management
│   ├── routes.ts - HTTP API endpoints
│   ├── state.ts - Game state management
│   └── storage.ts - Data persistence
├── shared/ - Shared code between client and server
│   ├── math.ts - Math utilities
│   ├── physics.ts - Physics calculations
│   ├── schema.ts - Data schemas
│   └── types.ts - TypeScript type definitions
└── docs/ - Documentation
```

## System Interactions

Orbital Nexus consists of several interacting systems:

1. **UDP Server**: Handles low-level networking with clients
2. **Game State Manager**: Validates and replicates game state
3. **Area of Interest Manager**: Determines relevant entities for each client
4. **Celestial Manager**: Simulates celestial bodies and orbits
5. **NPC Manager**: Controls AI-driven entities
6. **Mission Manager**: Generates and manages missions
7. **Sanity Check Manager**: Validates game state integrity

These systems work together to create a coherent, dynamic game world.

## Network Protocol

Orbital Nexus uses a custom UDP protocol optimized for space MMO requirements:

- Binary message format for efficiency
- Reliable and unreliable message support
- Client-authoritative with server validation
- Selective replication through AOI system

## Getting Started

To start working with Orbital Nexus:

1. Review the [main README](../README.md) for installation instructions
2. Understand the [server architecture](../README.md#architecture)
3. Explore the documentation for specific systems
4. Try running the server and connecting with a test client

## Extending the System

Orbital Nexus is designed to be extensible. Common extension points include:

- Adding new mission types in the Mission System
- Creating custom ship templates in the Ship Editor
- Implementing new celestial body types
- Adding new NPC behaviors and AI states
- Extending the UDP protocol with new message types

## Troubleshooting

If you encounter issues:

1. Check the server logs for error messages
2. Verify that your client is correctly implementing the UDP protocol
3. Use the admin dashboard to inspect the state of various systems
4. Consult the appropriate documentation section

## License

Orbital Nexus is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.