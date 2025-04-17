import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
}

interface SolarSystemVisualizationProps {
  celestialBodies: CelestialBody[];
  isLoading?: boolean;
}

export default function SolarSystemVisualization({
  celestialBodies,
  isLoading = false,
}: SolarSystemVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState("2d");
  const [scale, setScale] = useState("system");
  const [focusBody, setFocusBody] = useState<string | null>(null);
  
  useEffect(() => {
    if (isLoading || !canvasRef.current || celestialBodies.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up scale factors based on selected scale
    let scaleFactor = 1;
    switch (scale) {
      case "system":
        scaleFactor = 0.0000001; // Solar system scale
        break;
      case "inner":
        scaleFactor = 0.000001; // Inner planets scale
        break;
      case "outer":
        scaleFactor = 0.00000005; // Outer planets scale
        break;
    }
    
    // Find central body (typically the sun)
    const centralBody = celestialBodies.find(body => body.parentBodyId === null);
    
    if (!centralBody) return;
    
    // Canvas center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw orbit paths
    celestialBodies.forEach(body => {
      if (body.id === centralBody.id) return; // Skip central body
      
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.ellipse(
        centerX,
        centerY,
        body.semiMajorAxis * scaleFactor,
        body.semiMajorAxis * (1 - body.eccentricity) * scaleFactor,
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    });
    
    // Draw central body
    ctx.beginPath();
    ctx.fillStyle = centralBody.color || "#FFD700";
    const centralSize = Math.max(10, centralBody.radius * scaleFactor * 50);
    ctx.arc(centerX, centerY, centralSize, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw planets
    celestialBodies.forEach(body => {
      if (body.id === centralBody.id) return; // Skip central body
      
      // Calculate position based on orbital parameters
      const angle = (Date.now() / (body.orbitalPeriod * 10000)) * 2 * Math.PI;
      
      const distance = body.semiMajorAxis * scaleFactor;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      
      // Draw planet
      ctx.beginPath();
      ctx.fillStyle = body.color || "#3498db";
      // Size is exaggerated for visibility
      const size = Math.max(4, body.radius * scaleFactor * 200);
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw planet name if it's the focused body
      if (focusBody === body.name) {
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(body.name, x, y - size - 5);
      }
    });
    
    // Animation loop
    const animationId = requestAnimationFrame(() => {
      if (canvasRef.current) {
        // This will trigger a re-render periodically to animate
      }
    });
    
    return () => cancelAnimationFrame(animationId);
  }, [celestialBodies, isLoading, scale, focusBody, viewMode]);
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg h-full">
      <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-medium">Solar System</CardTitle>
        <div className="flex space-x-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-28 h-8">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2d">2D View</SelectItem>
              <SelectItem value="3d">3D View</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={scale} onValueChange={setScale}>
            <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-28 h-8">
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
      <CardContent className="p-0 relative aspect-video">
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
              className="w-full h-full"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {celestialBodies.map((body) => (
                <Badge 
                  key={body.id}
                  variant="outline"
                  className={`cursor-pointer ${focusBody === body.name ? 'border-primary text-primary' : 'text-gray-400 border-gray-700'}`}
                  onClick={() => setFocusBody(body.name === focusBody ? null : body.name)}
                  style={{backgroundColor: `${body.color}20`}}
                >
                  {body.name}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}