import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SolarSystemVisualization from "@/components/SolarSystemVisualization";
import CelestialBodyEditor from "@/components/CelestialBodyEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CelestialManagement() {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Fetch celestial bodies with refreshing when edits happen
  const { data: celestialData, isLoading } = useQuery({
    queryKey: ["/api/celestial", lastUpdate],
    refetchInterval: 3000
  });
  
  const celestialBodies = celestialData?.data || [];
  
  const handleBodyEdit = () => {
    // Trigger refresh on edit
    setLastUpdate(Date.now());
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4">
      <h1 className="text-2xl font-bold">Celestial Management</h1>
      <p className="text-muted-foreground">
        Manage celestial bodies in your solar system including planets, moons, asteroids, and space stations.
      </p>
      
      <Tabs defaultValue="visualization" className="w-full">
        <TabsList>
          <TabsTrigger value="visualization">Solar System</TabsTrigger>
          <TabsTrigger value="management">Manage Bodies</TabsTrigger>
          <TabsTrigger value="simulation">Simulation Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization" className="bg-black rounded-md mt-2">
          <div className="w-full">
            <SolarSystemVisualization 
              celestialBodies={celestialBodies} 
              isLoading={isLoading} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="management" className="mt-2">
          <CelestialBodyEditor onEdit={handleBodyEdit} />
        </TabsContent>
        
        <TabsContent value="simulation" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Settings</CardTitle>
              <CardDescription>
                Configure the celestial simulation parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimulationSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SimulationSettings() {
  const [speed, setSpeed] = useState<number>(1);
  
  const { data } = useQuery({
    queryKey: ["/api/celestial/settings"],
    refetchInterval: 5000
  });
  
  const simulationSettings = data?.data || { simulationSpeed: 1 };
  
  // Update simulation speed
  const updateSimulationSpeed = async (newSpeed: number) => {
    try {
      await fetch('/api/celestial/simulation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulationSpeed: newSpeed }),
      });
    } catch (error) {
      console.error('Failed to update simulation speed:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Simulation Speed: {simulationSettings.simulationSpeed}x
        </label>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(0.1)}
          >
            0.1x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(0.5)}
          >
            0.5x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(1)}
          >
            1x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(2)}
          >
            2x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(5)}
          >
            5x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(10)}
          >
            10x
          </button>
        </div>
      </div>
      
      <div className="pt-4">
        <p className="text-sm text-muted-foreground">
          Note: The simulation speed controls how fast time passes in the celestial simulation.
          Higher speeds will make planets orbit faster, but may reduce physics accuracy.
        </p>
      </div>
    </div>
  );
}