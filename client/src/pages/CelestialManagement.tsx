import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import SolarSystemVisualization from "@/components/SolarSystemVisualization";
import SolarSystem3D from "@/components/SolarSystem3D";
import CelestialBodyEditor from "@/components/CelestialBodyEditor";
import AsteroidGenerator from "@/components/AsteroidGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function CelestialManagement() {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
  
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
  
  const handleBodySelect = (body: any) => {
    setSelectedBodyId(body.id);
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
        
        <TabsContent value="visualization" className="mt-2">
          <div className="flex justify-end mb-2">
            <div className="bg-muted rounded-md p-1 inline-flex">
              <button 
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1 rounded ${viewMode === '2d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'}`}
              >
                2D Canvas
              </button>
              <button 
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 rounded ${viewMode === '3d' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'}`}
              >
                3D (Three.js)
              </button>
            </div>
          </div>
          
          <div className="w-full bg-black rounded-md">
            {viewMode === '2d' ? (
              <SolarSystemVisualization 
                celestialBodies={celestialBodies} 
                isLoading={isLoading}
                onSelectBody={handleBodySelect}
              />
            ) : (
              <SolarSystem3D 
                celestialBodies={celestialBodies} 
                isLoading={isLoading}
                onSelectBody={handleBodySelect}
              />
            )}
          </div>
          
          {selectedBodyId && (
            <div className="mt-2 p-4 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-2">Selected Body</h3>
              {celestialBodies
                .filter(body => body.id === selectedBodyId)
                .map(body => (
                  <div key={body.id} className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{body.name}</div>
                    <div className="font-medium">Type:</div>
                    <div>{body.type}</div>
                    <div className="font-medium">Mass:</div>
                    <div>{body.mass.toExponential(2)} kg</div>
                    <div className="font-medium">Radius:</div>
                    <div>{(body.radius / 1000).toFixed(0)} km</div>
                    {body.parentBodyId && (
                      <>
                        <div className="font-medium">Parent Body:</div>
                        <div>
                          {celestialBodies.find(b => b.id === body.parentBodyId)?.name || 'Unknown'}
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="management" className="mt-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <CelestialBodyEditor onEdit={handleBodyEdit} />
            </div>
            <div>
              <AsteroidGenerator onGenerate={handleBodyEdit} />
            </div>
          </div>
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
  const { toast } = useToast();
  const [localSpeed, setLocalSpeed] = useState<number>(1);
  
  // Query for simulation speed - more reliable endpoint
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/celestial/simulation/speed"],
    refetchInterval: 3000
  });
  
  const simulationSpeed = data?.data?.simulationSpeed || 1;
  
  // Update simulation speed mutation
  const updateSpeedMutation = useMutation({
    mutationFn: async (newSpeed: number) => {
      const response = await fetch('/api/celestial/simulation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulationSpeed: newSpeed }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update simulation speed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetch(); // Refresh the data after successful update
      toast({
        title: "Speed Updated",
        description: `Simulation now running at ${localSpeed}x speed`,
      });
    },
    onError: (error) => {
      console.error('Error updating simulation speed:', error);
      toast({
        title: "Error",
        description: "Failed to update simulation speed",
        variant: "destructive",
      });
    }
  });
  
  // Update simulation speed with extensive debugging
  const updateSimulationSpeed = (newSpeed: number) => {
    setLocalSpeed(newSpeed);
    console.log(`Attempting to update simulation speed to ${newSpeed}x using dedicated endpoint`);
    
    const url = '/api/celestial/simulation/speed';
    const payload = { speed: newSpeed };
    console.log('Request URL:', url);
    console.log('Request payload:', payload);
    
    // Send the update to the server using the new dedicated endpoint
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Response data:', data);
      
      if (data.success) {
        toast({
          title: "Speed Updated",
          description: `Simulation now running at ${newSpeed}x speed`,
        });
        refetch();
      } else {
        throw new Error(data.error || "Failed to update speed");
      }
    })
    .catch(err => {
      console.error("Error updating simulation speed:", err);
      toast({
        title: "Error",
        description: "Failed to update simulation speed. Please try again.",
        variant: "destructive",
      });
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Simulation Speed: {simulationSpeed}x
        </label>
        <div className="flex flex-wrap items-center gap-2">
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
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(100)}
          >
            100x
          </button>
          <button 
            className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            onClick={() => updateSimulationSpeed(1000)}
          >
            1000x
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