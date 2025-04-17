import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

interface PlanetaryStatusProps {
  celestialBodies: CelestialBody[];
  isLoading?: boolean;
}

export default function PlanetaryStatus({
  celestialBodies,
  isLoading = false,
}: PlanetaryStatusProps) {
  // Helper to format large numbers in scientific notation
  const formatScientific = (num: number): string => {
    if (num === 0) return '0';
    if (Math.abs(num) < 0.0001 || Math.abs(num) >= 10000) {
      return num.toExponential(2);
    }
    return num.toFixed(2);
  };
  
  // Calculate orbital progress percentage
  const getOrbitalProgress = (body: CelestialBody): number => {
    if (!body.orbitalPeriod) return 0;
    // Use time to calculate current position in orbit (0-100%)
    const timeMs = Date.now();
    const periodMs = body.orbitalPeriod * 24 * 60 * 60 * 1000; // Convert days to ms
    return ((timeMs % periodMs) / periodMs) * 100;
  };
  
  // Skip the central body (sun) and sort planets by distance from sun
  const planets = celestialBodies
    .filter(body => body.parentBodyId !== null)
    .sort((a, b) => a.semiMajorAxis - b.semiMajorAxis);
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg h-full">
      <CardHeader className="border-b border-gray-800 py-3 px-4">
        <CardTitle className="text-base font-medium">Planetary Status</CardTitle>
      </CardHeader>
      <CardContent className="p-0 min-h-[200px]">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {planets.length > 0 ? (
              planets.map((planet) => (
                <div key={planet.id} className="p-3 flex items-start space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full mt-1"
                    style={{ backgroundColor: planet.color || '#3498db' }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{planet.name}</h3>
                        <div className="flex items-center text-xs text-gray-400 space-x-1">
                          <span>Type: {planet.type}</span>
                          <span>•</span>
                          <span>Radius: {formatScientific(planet.radius)} km</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{backgroundColor: `${planet.color}20`, color: planet.color || 'inherit'}}
                      >
                        {(planet.orbitalPeriod || 0).toFixed(1)} days
                      </Badge>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Orbital Progress</span>
                        <span>{getOrbitalProgress(planet).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={getOrbitalProgress(planet)} 
                        className="h-1.5" 
                        style={{color: planet.color || 'var(--primary)'}}
                      />
                      
                      <div className="flex justify-between text-xs mt-2">
                        <span>Eccentricity: {(planet.eccentricity || 0).toFixed(3)}</span>
                        <span>Semi-Major Axis: {formatScientific((planet.semiMajorAxis || 0) / 1000)} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                No planetary data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}