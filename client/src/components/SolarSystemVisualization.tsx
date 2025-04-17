import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CelestialBody {
  id: number;
  name: string;
  type: string;
  radius: number;
  mass: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  orbitalPeriod: number;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  parentBodyId: number | null;
  color: string;
  // From API:
  currentPositionX: number;
  currentPositionY: number;
  currentPositionZ: number;
  currentVelocityX: number;
  currentVelocityY: number;
  currentVelocityZ: number;
  orbitProgress: number;
}

interface Entity {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  type: 'player' | 'npc';
}

interface SolarSystemVisualizationProps {
  celestialBodies: CelestialBody[];
  isLoading?: boolean;
  onSelectBody?: (body: CelestialBody) => void;
  entities?: Entity[]; // NPCs and players
}

export default function SolarSystemVisualization({
  celestialBodies,
  isLoading = false,
  onSelectBody,
  entities = []
}: SolarSystemVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState("2d");
  const [scale, setScale] = useState("system");
  const [focusBody, setFocusBody] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(4.0); // Custom zoom level - increased by 4x
  const [showEntities, setShowEntities] = useState(true); // Toggle for NPCs and players
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // For panning
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onSelectBody || celestialBodies.length === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale based on the canvas width/height vs the internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = x * scaleX;
    const clickY = y * scaleY;
    
    // Find central body
    const centralBody = celestialBodies.find(body => body.parentBodyId === null);
    if (!centralBody) return;
    
    // Calculate center of the canvas with panning
    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;
    
    // Set up scale factor based on the selected scale and zoom level
    let scaleFactor = 1;
    switch (scale) {
      case "system":
        scaleFactor = 0.0000000008 * zoomLevel; // Solar system scale
        break;
      case "inner":
        scaleFactor = 0.000000004 * zoomLevel; // Inner planets scale
        break;
      case "outer":
        scaleFactor = 0.0000000002 * zoomLevel; // Outer planets scale
        break;
    }
    
    // Define size scaling factor - same as in rendering
    const radiusScaleFactor = 0.00000003;
    
    // Check if we clicked on any celestial body
    let clickedBody: CelestialBody | null = null;
    let minDist = Number.MAX_VALUE;
    
    // Calculate the distance to the sun first
    const sunSize = Math.max(15, centralBody.radius * radiusScaleFactor);
    const sunDist = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
    
    if (sunDist <= sunSize) {
      clickedBody = centralBody;
      minDist = sunDist;
    }
    
    // Check all other bodies
    for (const body of celestialBodies) {
      if (body.id === centralBody.id) continue; // Skip central body, already checked
      
      // Use the current position data from the API
      const posX = body.currentPositionX * scaleFactor;
      const posY = body.currentPositionY * scaleFactor;
      
      // Calculate screen position
      const x = centerX + posX;
      const y = centerY + posY;
      
      // Skip if off-screen
      if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) continue;
      
      // Size is exaggerated for visibility - same as in rendering
      const size = Math.max(3, body.radius * radiusScaleFactor * 4);
      
      // Calculate distance from click to the body
      const dist = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
      
      // If within the body's radius and closer than any previous match
      if (dist <= size && dist < minDist) {
        clickedBody = body;
        minDist = dist;
      }
    }
    
    // If we found a body and we have an onSelectBody callback
    if (clickedBody && onSelectBody) {
      onSelectBody(clickedBody);
      setFocusBody(clickedBody.name);
    }
  }, [celestialBodies, scale, onSelectBody, zoomLevel, panOffset]);
  
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || celestialBodies.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with a dark background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some starfield effect
    const numStars = 500;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 1.5;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
    // Set up scale factors based on selected scale and zoom level
    let scaleFactor = 1;
    switch (scale) {
      case "system":
        scaleFactor = 0.0000000008 * zoomLevel; // Solar system scale
        break;
      case "inner":
        scaleFactor = 0.000000004 * zoomLevel; // Inner planets scale
        break;
      case "outer":
        scaleFactor = 0.0000000002 * zoomLevel; // Outer planets scale
        break;
    }
    
    // Find central body (typically the sun)
    const centralBody = celestialBodies.find(body => body.parentBodyId === null);
    
    if (!centralBody) return;
    
    // Apply panning offset to the canvas center
    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;
    
    // Draw orbit paths for all planets
    celestialBodies.forEach(body => {
      if (body.id === centralBody.id || !body.semiMajorAxis) return; // Skip central body or invalid bodies
      
      const orbitRadius = body.semiMajorAxis * scaleFactor;
      
      // Skip if the orbit is too big or too small to show
      if (orbitRadius < 1 || orbitRadius > canvas.width) return;
      
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.ellipse(
        centerX,
        centerY,
        orbitRadius,
        orbitRadius * (1 - body.eccentricity),
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    });
    
    // Define size scaling factor - exaggerated for visibility
    const radiusScaleFactor = 0.00000003;
    
    // Draw central body (sun)
    const sunSize = Math.max(15, centralBody.radius * radiusScaleFactor);
    ctx.beginPath();
    ctx.fillStyle = centralBody.color || "#FFD700";
    
    // Create sun glow effect
    const sunGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, sunSize * 1.5
    );
    sunGradient.addColorStop(0, centralBody.color || "#FFD700");
    sunGradient.addColorStop(0.7, "rgba(255, 220, 0, 0.8)");
    sunGradient.addColorStop(1, "rgba(255, 120, 0, 0)");
    
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunSize * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Solid sun
    ctx.fillStyle = centralBody.color || "#FFD700";
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw planets with true positions
    celestialBodies.forEach((body) => {
      if (body.id === centralBody.id) return; // Skip central body
      
      // Use the current position data from the API
      const posX = body.currentPositionX * scaleFactor;
      const posY = body.currentPositionY * scaleFactor;
      
      // Calculate screen position
      const x = centerX + posX;
      const y = centerY + posY;
      
      // Skip if off-screen
      if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) return;
      
      // Size is exaggerated for visibility
      const size = Math.max(3, body.radius * radiusScaleFactor * 4);
      
      // Draw planet with glow effect based on type
      ctx.beginPath();
      
      if (body.type === "planet") {
        // Create a subtle glow for planets
        const planetGradient = ctx.createRadialGradient(
          x, y, 0,
          x, y, size * 1.3
        );
        planetGradient.addColorStop(0, body.color);
        planetGradient.addColorStop(0.7, body.color + "80");
        planetGradient.addColorStop(1, body.color + "00");
        
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw the planet itself
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw orbit progress as a small dot on the orbit
      if (body.orbitProgress !== undefined) {
        const orbitRadius = body.semiMajorAxis * scaleFactor;
        const angle = body.orbitProgress * Math.PI * 2;
        const orbitX = centerX + orbitRadius * Math.cos(angle);
        const orbitY = centerY + orbitRadius * Math.sin(angle);
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(orbitX, orbitY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw planet name label
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      
      // Always show name for larger bodies, or show when focused
      if (focusBody === body.name || body.type === "planet") {
        // Create a subtle text shadow for better readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 3;
        ctx.fillText(body.name, x, y - size - 5);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw NPC and player entities if toggle is on
    if (showEntities && entities.length > 0) {
      // Draw entities (NPCs and players)
      entities.forEach(entity => {
        // Convert entity position to canvas coordinates
        const entityX = entity.position.x * scaleFactor;
        const entityY = entity.position.y * scaleFactor;
        
        // Calculate screen position
        const x = centerX + entityX;
        const y = centerY + entityY;
        
        // Skip if off-screen
        if (x < -10 || x > canvas.width + 10 || y < -10 || y > canvas.height + 10) return;
        
        // Different colors for NPCs and players
        const entityColor = entity.type === 'player' ? '#4CAF50' : '#FF5722';
        const entitySize = entity.type === 'player' ? 6 : 4;
        
        // Draw entity
        ctx.fillStyle = entityColor;
        ctx.beginPath();
        ctx.arc(x, y, entitySize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw halo effect
        ctx.strokeStyle = entityColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, entitySize + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Show entity ID on hover (for future implementation)
        // ctx.fillText(entity.id, x, y - entitySize - 5);
      });
    }
  }, [celestialBodies, scale, focusBody, zoomLevel, showEntities, entities, panOffset]);

  // Setup animation loop
  useEffect(() => {
    if (isLoading || celestialBodies.length === 0) return;
    
    let animationFrameId: number;
    
    const animate = () => {
      renderCanvas();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoading, celestialBodies, renderCanvas]);
  
  return (
    <Card className="bg-background border border-border shadow-lg h-full overflow-hidden">
      <CardHeader className="border-b border-border py-3 px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-medium flex items-center">
          <span className="text-yellow-500 mr-2">☀</span>
          Solar System Visualization
        </CardTitle>
        <div className="flex space-x-3 items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-entities"
              checked={showEntities}
              onCheckedChange={setShowEntities}
            />
            <Label htmlFor="show-entities" className="text-sm">Show NPCs/Players</Label>
          </div>
          <Select value={scale} onValueChange={setScale}>
            <SelectTrigger className="bg-background text-sm rounded border border-input w-28 h-8">
              <SelectValue placeholder="Scale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Full System</SelectItem>
              <SelectItem value="inner">Inner Planets</SelectItem>
              <SelectItem value="outer">Outer Planets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative aspect-video bg-black">
        {isLoading ? (
          <div className="p-4 flex justify-center items-center h-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={450} 
              className="w-full h-full cursor-pointer"
              onClick={handleCanvasClick}
              onMouseDown={(e) => {
                if (e.button === 0) { // Left mouse button
                  setIsPanning(true);
                  setLastPanPos({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseMove={(e) => {
                if (isPanning) {
                  const dx = e.clientX - lastPanPos.x;
                  const dy = e.clientY - lastPanPos.y;
                  setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                  setLastPanPos({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
            />
            
            {/* Zoom and pan controls */}
            <div className="absolute bottom-4 left-4 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-md text-white">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(0.2, prev / 1.5))}
                className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
                title="Zoom Out"
              >
                -
              </button>
              <button 
                onClick={() => setZoomLevel(1.0)}
                className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
                title="Reset Zoom"
              >
                Reset Zoom
              </button>
              <button 
                onClick={() => setZoomLevel(prev => prev * 1.5)}
                className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
                title="Zoom In"
              >
                +
              </button>
              <button 
                onClick={() => setPanOffset({ x: 0, y: 0 })}
                className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 ml-2"
                title="Reset Pan"
              >
                Reset Pan
              </button>
            </div>
            
            {/* Planet selector */}
            <div className="absolute bottom-4 left-0 right-0 flex flex-wrap justify-center gap-1 px-2">
              {celestialBodies.map((body) => (
                body.type === "planet" && (
                  <Badge 
                    key={body.id}
                    variant={focusBody === body.name ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all hover:scale-110"
                    onClick={() => {
                      const newFocus = body.name === focusBody ? null : body.name;
                      setFocusBody(newFocus);
                      if (newFocus && onSelectBody) {
                        onSelectBody(body);
                      }
                    }}
                    style={{
                      backgroundColor: focusBody === body.name ? body.color : 'transparent',
                      borderColor: body.color,
                      color: focusBody === body.name ? '#000' : body.color
                    }}
                  >
                    {body.name}
                  </Badge>
                )
              ))}
            </div>
            
            {/* Info panel when a planet is selected */}
            {focusBody && (
              <div className="absolute top-4 right-4 w-48 bg-black bg-opacity-70 backdrop-blur-sm p-3 rounded border border-gray-700">
                <h4 className="font-medium mb-2">{focusBody}</h4>
                {celestialBodies.find(b => b.name === focusBody) && (
                  <div className="text-xs space-y-1 text-gray-300">
                    <p>Type: {celestialBodies.find(b => b.name === focusBody)?.type}</p>
                    <p>Radius: {(celestialBodies.find(b => b.name === focusBody)?.radius! / 1000).toLocaleString()} km</p>
                    <p>Mass: {(celestialBodies.find(b => b.name === focusBody)?.mass! / 1e24).toFixed(2)}×10²⁴ kg</p>
                    <p>Orbit Progress: {(celestialBodies.find(b => b.name === focusBody)?.orbitProgress! * 100).toFixed(1)}%</p>
                    {celestialBodies.find(b => b.name === focusBody)?.orbitalPeriod && (
                      <p>Orbital Period: {(celestialBodies.find(b => b.name === focusBody)?.orbitalPeriod! / 86400).toFixed(2)} days</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}