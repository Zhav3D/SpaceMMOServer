import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SolarSystemVisualization from "@/components/SolarSystemVisualization";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SolarSystem() {
  const [simulationSpeed, setSimulationSpeed] = useState("10");
  const { toast } = useToast();

  const { data: celestialBodies, isLoading, refetch } = useQuery({
    queryKey: ['/api/celestial'],
    staleTime: 5000,
  });
  
  const { data: npcFleets } = useQuery({
    queryKey: ['/api/npc/fleets'],
    staleTime: 5000,
  });
  
  const { data: simulatedPlayers } = useQuery({
    queryKey: ['/api/simulated-players'],
    staleTime: 5000,
  });

  const handleSimulationSpeedChange = async (value: string) => {
    try {
      setSimulationSpeed(value);
      
      const response = await apiRequest('PUT', '/api/celestial/simulation', {
        speed: parseFloat(value)
      });
      
      if (response.ok) {
        toast({
          title: "Simulation Speed Updated",
          description: `Speed set to ${value}x`,
        });
      } else {
        throw new Error('Failed to update simulation speed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update simulation speed",
        variant: "destructive",
      });
      console.error("Error updating simulation speed:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Solar System</h1>
        <p className="text-gray-400">Orbital mechanics visualization and management</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="bg-background-dark border-gray-800 shadow-lg h-[600px] overflow-hidden">
            <CardHeader className="border-b border-gray-800 flex flex-row justify-between items-center py-3 px-4">
              <CardTitle className="text-base font-medium">Solar System Visualization</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Simulation Speed:</span>
                <Select value={simulationSpeed} onValueChange={handleSimulationSpeedChange}>
                  <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-40 h-8">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Real-time (1x)</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="100">100x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <SolarSystemVisualization 
                celestialBodies={celestialBodies?.success ? celestialBodies.data : []} 
                isLoading={isLoading} 
                fullSize={true}
                npcData={npcFleets}
                simulatedPlayers={simulatedPlayers}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Celestial Bodies</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">Loading celestial bodies...</div>
                ) : celestialBodies?.success && celestialBodies.data ? (
                  celestialBodies.data.map((body: any) => (
                    <div key={body.id} className="border-b border-gray-800 pb-4 last:pb-0 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: body.color || '#ffffff' }}
                          ></div>
                          <h3 className="font-medium text-lg">{body.name}</h3>
                        </div>
                        <span className="text-xs font-mono text-gray-400">ID: {body.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="text-gray-400">Type: <span className="text-white font-mono">{body.type}</span></div>
                        <div className="text-gray-400">Radius: <span className="text-white font-mono">{(body.radius / 1000).toFixed(0)} km</span></div>
                        <div className="text-gray-400">Mass: <span className="text-white font-mono">{body.mass.toExponential(2)} kg</span></div>
                        <div className="text-gray-400">Orbital Period: 
                          <span className="text-white font-mono">
                            {body.semiMajorAxis ? Math.sqrt(body.semiMajorAxis * body.semiMajorAxis * body.semiMajorAxis / 1.327e20).toFixed(2) + ' years' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {typeof body.orbitProgress === 'number' && (
                        <>
                          <div className="w-full bg-gray-800 h-1 mb-1">
                            <div 
                              className="h-1" 
                              style={{ 
                                width: `${body.orbitProgress * 100}%`,
                                backgroundColor: body.color || 'hsl(var(--secondary))'
                              }}
                            ></div>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            Current orbit: {(body.orbitProgress * 100).toFixed(1)}% complete
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">No celestial bodies found</div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="text-secondary border-secondary hover:bg-secondary/10"
                >
                  <span className="material-icons text-sm mr-1">refresh</span>
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
