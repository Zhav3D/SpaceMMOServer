import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface AreaOfInterest {
  id: number;
  name: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  nearestCelestialBodyId: number;
  playerCount: number;
  npcCount: number;
  updateFrequency: number;
  latency: number;
  load: number;
  capacityLimit: number;
}

interface AreaOfInterestMonitorProps {
  areasOfInterest: AreaOfInterest[];
  isLoading?: boolean;
}

export default function AreaOfInterestMonitor({
  areasOfInterest,
  isLoading = false,
}: AreaOfInterestMonitorProps) {
  // Get load color based on percentage
  const getLoadColor = (load: number): string => {
    if (load < 33) return "text-success";
    if (load < 66) return "text-warning";
    return "text-error";
  };
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg h-full">
      <CardHeader className="border-b border-gray-800 py-3 px-4">
        <CardTitle className="text-base font-medium">Areas of Interest</CardTitle>
      </CardHeader>
      <CardContent className="p-0 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {areasOfInterest.length > 0 ? (
              areasOfInterest.map((area) => (
                <div key={area.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{area.name}</h3>
                    <Badge 
                      variant={area.load < 66 ? (area.load < 33 ? "success" : "warning") : "destructive"}
                    >
                      {area.playerCount + area.npcCount} / {area.capacityLimit}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mt-1 space-x-2">
                    <span>{area.playerCount} players</span>
                    <span>•</span>
                    <span>{area.npcCount} NPCs</span>
                    <span>•</span>
                    <span>{area.updateFrequency} Hz</span>
                    <span>•</span>
                    <span>{area.latency} ms</span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Capacity</span>
                      <span className={getLoadColor(area.load)}>{area.load}%</span>
                    </div>
                    <Progress 
                      value={area.load} 
                      className={`h-2 ${getLoadColor(area.load)}`} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-xs">
                      <div className="text-gray-400 mb-1">Position</div>
                      <div className="font-mono">
                        X: {area.centerX.toFixed(0)}<br />
                        Y: {area.centerY.toFixed(0)}<br />
                        Z: {area.centerZ.toFixed(0)}
                      </div>
                    </div>
                    
                    <div className="text-xs">
                      <div className="text-gray-400 mb-1">Coverage</div>
                      <div className="font-mono">
                        Radius: {area.radius.toLocaleString()} units<br />
                        Volume: {((4/3) * Math.PI * Math.pow(area.radius, 3) / 1e9).toFixed(2)} B km³
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                No areas of interest defined
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}