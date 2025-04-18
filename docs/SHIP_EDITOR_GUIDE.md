# Ship Editor Guide

The Ship Editor is a powerful feature in Orbital Nexus that allows you to create, customize, and fine-tune ship templates for NPCs in the game world. This guide will walk you through using the ship editor effectively.

## Overview

The Ship Editor consists of three main tabs:

1. **Ship Templates**: Create, view, edit, and manage ship templates
2. **Detailed Editor**: Customize core parameters of a selected template
3. **Advanced Tuning**: Fine-tune specialized parameters based on ship type

## Ship Types

There are four types of ships in Orbital Nexus:

- **Combat (Enemy)** - Military vessels designed for combat operations
- **Transport** - Cargo vessels designed for trade and transportation
- **Civilian** - Passenger and general-purpose vessels
- **Mining** - Specialized vessels for resource extraction

Each ship type has its own default parameters and specialized settings.

## Basic Template Management

### Creating a New Template

1. Navigate to the Ship Editor in the dashboard
2. In the "Ship Templates" tab, select one of the ship types (Combat, Transport, Civilian, Mining)
3. Fill in the basic information in the dialog:
   - Name
   - Description
   - Ship Type
   - Basic parameters (mass, speed, etc.)
4. Click "Create Template"

### Editing an Existing Template

1. Find the template in the list
2. Click the "Edit" button
3. Modify the parameters as needed
4. Click "Save Changes"

### Duplicating a Template

1. Find the template you want to duplicate
2. Click the "Clone" button
3. A new template dialog will appear with the same parameters
4. Modify as needed and click "Create Template"

### Deleting a Template

1. Find the template you want to delete
2. Click the "Delete" button
3. Confirm deletion in the dialog

## Detailed Editor

The Detailed Editor provides access to all core parameters for a template:

### Basic Information
- **Name**: The template name
- **Description**: A detailed description
- **Ship Type**: The type of ship

### Performance Characteristics
- **Mass**: Ship mass in tons
- **Max Speed**: Maximum velocity in m/s
- **Acceleration**: Maximum acceleration in m/s²
- **Turn Rate**: Turning speed in rad/s

### Sensor & Detection
- **Detection Range**: How far the ship can detect other entities
- **Signature Radius**: How visible the ship is to others

### Combat Parameters
- **Attack Range**: Maximum weapon range
- **Flee Threshold**: Health percentage at which the ship will attempt to flee

### Advanced Navigation Parameters
- **Waypoint Arrival Distance**: How close to get to a waypoint before considering it reached
- **Pathfinding Update Interval**: How often to recalculate paths
- **Obstacle Avoidance Distance**: How far away to begin avoiding obstacles
- **Formation Keeping Tolerance**: How precisely to maintain formation position

## Advanced Tuning

The Advanced Tuning tab provides specialized parameters based on ship type:

### Combat Ships
- **Combat Fine-Tuning**: Weapon accuracy, range priority, weapon cycling
- **Power Distribution**: Allocate power between weapons, shields, and engines
- **Combat Stance**: Set aggressive, balanced, or defensive stance

### Transport Ships
- **Cargo Configuration**: Set cargo capacity, load balancing systems
- **Transport Specialization**: Define transport class and cargo type
- **Route Planning**: Configure routing behavior

### Mining Ships
- **Mining Equipment**: Configure mining laser power and extraction methods
- **Mining Operations**: Set target material priorities and operation modes
- **Resource Detection**: Configure scanning equipment

### Civilian Ships
- **Civilian Specialization**: Set vessel type and passenger capacity
- **Safety Systems**: Configure emergency protocols and safety features
- **Comfort Level**: Adjust passenger comfort settings

## Tips for Effective Ship Design

1. **Balance parameters** - Ships with high speed should generally have lower mass for realism
2. **Specialize ships** - Create focused templates rather than "jack of all trades" designs
3. **Consider AI behavior** - Parameters should match the expected AI behavior
4. **Create variations** - Create multiple versions of similar ships with slight variations
5. **Use descriptive names** - Name templates clearly based on their function

## Applying Templates to NPCs

Ship templates are automatically used when new NPCs are spawned in the game world. The server will select appropriate templates based on the NPC's type.

To manually apply a template to an existing NPC:
1. Navigate to the NPC management section
2. Select the NPC or fleet
3. Choose "Apply Template" and select from the available templates

## Advanced Usage

For advanced users, it's possible to create specialized ship templates for specific mission types or scenarios. Create templates with parameters optimized for:

- Patrol missions
- Escort duty
- Long-range reconnaissance
- Close combat
- Defensive operations
- Special operations

By creating a diverse set of specialized templates, you'll create a more dynamic and interesting game world.