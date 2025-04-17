import { Vector3 } from '@shared/math';
import { MessageType, ServerSanityCheckMessage } from '@shared/types';
import { UDPServer } from './udp';
import { Player } from '@shared/schema';

// Types of sanity checks
export enum SanityCheckType {
  POSITION = 'position',
  VELOCITY = 'velocity',
  ACCELERATION = 'acceleration',
  COLLISION = 'collision'
}

// Result of a sanity check
export interface SanityCheckResult {
  passed: boolean;
  reason?: string;
}

// Sanity check manager for server-side validation
export class SanityCheckManager {
  private udpServer: UDPServer;
  private checks: Map<string, { timestamp: number, checkId: number, type: SanityCheckType }> = new Map();
  private checkCounter: number = 0;
  
  // Configuration
  private maxVelocity: number = 1000.0; // Maximum allowed velocity magnitude
  private maxAcceleration: number = 500.0; // Maximum allowed acceleration magnitude
  private positionTolerance: number = 10.0; // Maximum allowed position deviation
  
  constructor(udpServer: UDPServer) {
    this.udpServer = udpServer;
  }
  
  // Run a sanity check for a player
  runCheck(
    clientId: string,
    type: SanityCheckType,
    player: Player
  ): void {
    const checkId = this.checkCounter++;
    const now = Date.now();
    
    // Remember this check
    this.checks.set(`${clientId}-${checkId}`, {
      timestamp: now,
      checkId,
      type
    });
    
    // Create the sanity check message
    const message: ServerSanityCheckMessage = {
      messageType: MessageType.SERVER_SANITY_CHECK,
      sequence: 0, // Will be set by UDP server
      timestamp: now,
      clientId,
      checkId,
      checkType: type,
    };
    
    // Add expected values based on check type
    switch (type) {
      case SanityCheckType.POSITION:
        message.expectedValue = {
          position: new Vector3(player.positionX, player.positionY, player.positionZ)
        };
        message.tolerance = this.positionTolerance;
        break;
        
      case SanityCheckType.VELOCITY:
        message.expectedValue = {
          velocity: new Vector3(player.velocityX, player.velocityY, player.velocityZ)
        };
        message.tolerance = this.maxVelocity * 0.1; // 10% of max velocity
        break;
        
      case SanityCheckType.ACCELERATION:
        // No expected value, client should report current acceleration
        break;
        
      case SanityCheckType.COLLISION:
        // No expected value, client should report collision status
        break;
    }
    
    // Send the check request
    this.udpServer.sendToClient(clientId, message, true); // Use reliable delivery
  }
  
  // Process a sanity check response from client
  processCheckResponse(
    clientId: string,
    checkId: number,
    clientValue: any
  ): SanityCheckResult {
    // Find the original check
    const checkKey = `${clientId}-${checkId}`;
    const check = this.checks.get(checkKey);
    
    if (!check) {
      return { passed: false, reason: 'Unknown check ID' };
    }
    
    // Remove this check from pending checks
    this.checks.delete(checkKey);
    
    // Check response time (should be reasonably quick)
    const responseTime = Date.now() - check.timestamp;
    if (responseTime > 5000) { // 5 seconds max
      return { passed: false, reason: 'Response timeout' };
    }
    
    // Validate based on check type
    switch (check.type) {
      case SanityCheckType.POSITION:
        return this.validatePosition(clientValue);
        
      case SanityCheckType.VELOCITY:
        return this.validateVelocity(clientValue);
        
      case SanityCheckType.ACCELERATION:
        return this.validateAcceleration(clientValue);
        
      case SanityCheckType.COLLISION:
        return this.validateCollision(clientValue);
        
      default:
        return { passed: false, reason: 'Unknown check type' };
    }
  }
  
  // Validate client-reported position
  private validatePosition(clientValue: any): SanityCheckResult {
    if (!clientValue || !clientValue.position) {
      return { passed: false, reason: 'Missing position data' };
    }
    
    // Position validation would compare client position to expected position
    // For now, just check if the position is within reasonable bounds
    const position = clientValue.position as Vector3;
    const magnitude = position.magnitude();
    
    // Very basic check - position should not be too far from origin
    // In a real game, this would be more sophisticated
    const maxDistance = 1.0e12; // Very large value for space game
    if (magnitude > maxDistance) {
      return { 
        passed: false, 
        reason: `Position too far from origin: ${magnitude} > ${maxDistance}` 
      };
    }
    
    return { passed: true };
  }
  
  // Validate client-reported velocity
  private validateVelocity(clientValue: any): SanityCheckResult {
    if (!clientValue || !clientValue.velocity) {
      return { passed: false, reason: 'Missing velocity data' };
    }
    
    const velocity = clientValue.velocity as Vector3;
    const magnitude = velocity.magnitude();
    
    if (magnitude > this.maxVelocity) {
      return { 
        passed: false, 
        reason: `Velocity magnitude too high: ${magnitude} > ${this.maxVelocity}` 
      };
    }
    
    return { passed: true };
  }
  
  // Validate client-reported acceleration
  private validateAcceleration(clientValue: any): SanityCheckResult {
    if (!clientValue || !clientValue.acceleration) {
      return { passed: false, reason: 'Missing acceleration data' };
    }
    
    const acceleration = clientValue.acceleration as Vector3;
    const magnitude = acceleration.magnitude();
    
    if (magnitude > this.maxAcceleration) {
      return { 
        passed: false, 
        reason: `Acceleration magnitude too high: ${magnitude} > ${this.maxAcceleration}` 
      };
    }
    
    return { passed: true };
  }
  
  // Validate client-reported collision
  private validateCollision(clientValue: any): SanityCheckResult {
    // Basic collision validation
    // In a real implementation, this would check against server's collision detection
    return { passed: true };
  }
  
  // Clear old checks that haven't received responses
  cleanupOldChecks(): void {
    const now = Date.now();
    const timeout = 10000; // 10 seconds
    
    for (const [key, check] of this.checks.entries()) {
      if (now - check.timestamp > timeout) {
        this.checks.delete(key);
      }
    }
  }
  
  // Get check count
  getCheckCount(): number {
    return this.checks.size;
  }
  
  // Set check parameters
  setCheckParameters(
    maxVelocity?: number,
    maxAcceleration?: number,
    positionTolerance?: number
  ): void {
    if (maxVelocity !== undefined) this.maxVelocity = maxVelocity;
    if (maxAcceleration !== undefined) this.maxAcceleration = maxAcceleration;
    if (positionTolerance !== undefined) this.positionTolerance = positionTolerance;
  }
}
