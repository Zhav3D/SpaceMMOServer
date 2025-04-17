import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  RotateCw,
  AlignVerticalSpaceAround,
  BarChart2,
  Gauge,
  Map,
  MonitorPlay,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Client simulator canvas component for visualizing the player's position
const ClientView: React.FC<{ 
  client: any,
  celestialBodies: any[],
  npcs: any[],
  otherPlayers: any[],
  selectedArea: string
}> = ({ client, celestialBodies, npcs, otherPlayers, selectedArea }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw game state on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set center of canvas as origin
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw background (space)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw player position
    if (client) {
      const playerX = centerX;
      const playerY = centerY;
      
      // Player ship
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(playerX, playerY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Direction indicator
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      ctx.lineTo(
        playerX + Math.sin(client.rotation?.y || 0) * 20,
        playerY + Math.cos(client.rotation?.y || 0) * 20
      );
      ctx.stroke();
    }
    
    // Draw celestial bodies
    if (celestialBodies) {
      celestialBodies.forEach(body => {
        // Calculate relative position
        const relX = (body.position?.x || 0) - (client?.position?.x || 0);
        const relY = (body.position?.z || 0) - (client?.position?.z || 0);
        
        const x = centerX + relX * 0.001; // Scale down for visibility
        const y = centerY + relY * 0.001;
        
        const radius = Math.max(5, body.radius * 0.00001); // Minimum 5px radius
        
        ctx.fillStyle = body.color || '#AAAAFF';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(body.name, x, y + radius + 12);
      });
    }
    
    // Draw NPC ships
    if (npcs) {
      npcs.forEach(npc => {
        const relX = (npc.position?.x || 0) - (client?.position?.x || 0);
        const relY = (npc.position?.z || 0) - (client?.position?.z || 0);
        
        const x = centerX + relX * 0.01;
        const y = centerY + relY * 0.01;
        
        // Different colors for different NPC types
        let color = '#FF0000';
        if (npc.type === 'transport') color = '#FFA500';
        if (npc.type === 'civilian') color = '#0096FF';
        if (npc.type === 'mining') color = '#FFFF00';
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw other players
    if (otherPlayers && Array.isArray(otherPlayers)) {
      otherPlayers.forEach(player => {
        if (player.clientId === client?.clientId) return; // Skip self
        
        const relX = (player.position?.x || 0) - (client?.position?.x || 0);
        const relY = (player.position?.z || 0) - (client?.position?.z || 0);
        
        const x = centerX + relX * 0.01;
        const y = centerY + relY * 0.01;
        
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.clientId || 'Player', x, y + 15);
      });
    }
    
    // Draw area boundary indicator
    if (selectedArea) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Area label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Area: ${selectedArea}`, centerX, 20);
    }
    
  }, [client, celestialBodies, npcs, otherPlayers, selectedArea]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={800}
      height={600}
      className="border rounded-md bg-black"
    />
  );
};

// Controls component for controlling the client
const ClientControls: React.FC<{
  onMoveForward: () => void,
  onMoveBackward: () => void,
  onMoveLeft: () => void,
  onMoveRight: () => void,
  onRotateLeft: () => void,
  onRotateRight: () => void,
  onSelectArea: (areaId: string) => void,
  onSpeedChange: (speed: number) => void,
  selectedArea: string,
  areas: any[],
  speed: number,
  client: any,
  isRegistered?: boolean,
  onRegister?: () => void
}> = ({ 
  onMoveForward,
  onMoveBackward,
  onMoveLeft,
  onMoveRight,
  onRotateLeft,
  onRotateRight,
  onSelectArea,
  onSpeedChange,
  selectedArea,
  areas,
  speed,
  client,
  isRegistered = false,
  onRegister
}) => {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Target className="mr-2 h-5 w-5" /> 
            Area Selection
          </CardTitle>
          <CardDescription>
            Select which area of interest to connect the client to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Server Registration:</span>
              {isRegistered ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Registered
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                  Not Registered
                </Badge>
              )}
            </div>
            
            {!isRegistered && onRegister && (
              <Button 
                onClick={onRegister}
                className="w-full" 
                variant="outline"
                disabled={!selectedArea || !earth}
              >
                Register with Server
              </Button>
            )}
          </div>
          
          <Select 
            value={selectedArea} 
            onValueChange={onSelectArea}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {areas.map(area => (
                <SelectItem key={area.areaId} value={area.areaId}>
                  {area.name} - {area.entityCount} entities
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {client && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-mono">
                  {Math.round(client.position?.x || 0)}, 
                  {Math.round(client.position?.y || 0)}, 
                  {Math.round(client.position?.z || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Velocity:</span>
                <span className="font-mono">
                  {Math.round((client.velocity?.x || 0) * 100) / 100}, 
                  {Math.round((client.velocity?.y || 0) * 100) / 100}, 
                  {Math.round((client.velocity?.z || 0) * 100) / 100}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Gauge className="mr-2 h-5 w-5" /> 
            Speed Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Min</span>
            <Slider
              value={[speed]}
              onValueChange={(values) => onSpeedChange(values[0])}
              max={100}
              step={1}
            />
            <span className="text-sm">Max</span>
          </div>
          <div className="mt-2 text-center">
            <Badge variant="outline">{speed}%</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlignVerticalSpaceAround className="mr-2 h-5 w-5" /> 
            Movement Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 items-center justify-items-center">
            <div></div>
            <Button variant="default" size="lg" onClick={onMoveForward}>
              <ArrowUp className="h-5 w-5" />
            </Button>
            <div></div>
            
            <Button variant="default" size="lg" onClick={onMoveLeft}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Map className="h-5 w-5 text-muted-foreground" />
            </div>
            <Button variant="default" size="lg" onClick={onMoveRight}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <div></div>
            <Button variant="default" size="lg" onClick={onMoveBackward}>
              <ArrowDown className="h-5 w-5" />
            </Button>
            <div></div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between mt-2">
            <Button variant="outline" size="lg" onClick={onRotateLeft}>
              <RotateCcw className="h-5 w-5" />
            </Button>
            <div className="text-center text-sm font-medium">
              Rotation
            </div>
            <Button variant="outline" size="lg" onClick={onRotateRight}>
              <RotateCw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Client stats component
const ClientStats: React.FC<{ client: any }> = ({ client }) => {
  const [ping, setPing] = useState<number[]>([]);
  const maxPingHistory = 30;
  
  // Simulate ping data
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(prev => {
        const newPing = [...prev, Math.floor(Math.random() * 30) + 20];
        if (newPing.length > maxPingHistory) newPing.shift();
        return newPing;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!client) return null;
  
  const avgPing = ping.length > 0 ? 
    Math.round(ping.reduce((sum, p) => sum + p, 0) / ping.length) : 0;
  
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <BarChart2 className="mr-2 h-5 w-5" /> 
            Connection Stats
          </CardTitle>
          <CardDescription>
            Network performance and client statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Current Ping</span>
                <Badge variant="outline" className={
                  avgPing < 50 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                  avgPing < 100 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }>
                  {avgPing} ms
                </Badge>
              </div>
              <div className="h-12 bg-muted rounded-md overflow-hidden flex items-end">
                {ping.map((p, i) => (
                  <div 
                    key={i}
                    className={`w-2 m-px ${
                      p < 50 ? "bg-green-500" :
                      p < 100 ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}
                    style={{ height: `${Math.min(p/2, 100)}%` }}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-sm font-medium mb-1">Packet Loss</div>
                <div className="flex items-center">
                  <Progress value={2} className="h-2" />
                  <span className="text-xs ml-2">2%</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Connection</div>
                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  UDP
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Update Rate</div>
                <div className="flex items-center">
                  <span className="text-sm">20</span>
                  <span className="text-xs ml-1 text-muted-foreground">ticks/s</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Connected Time</div>
                <div className="flex items-center">
                  <span className="text-sm">00:05:32</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MonitorPlay className="mr-2 h-5 w-5" /> 
            Client Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Known Entities</div>
              <div className="text-xl font-bold">128</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Last Update</div>
              <div className="text-sm">12 ms ago</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Messages/s</div>
              <div className="text-xl font-bold">24</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Updates/s</div>
              <div className="text-xl font-bold">20</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ClientSimulator() {
  // State for simulated client
  const [client, setClient] = useState<any>({
    clientId: "sim-" + Math.random().toString(36).substring(2, 9),
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connected: true,
    areaId: '',
  });
  
  // State to track if player is registered with server
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  
  // Controls state
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [speed, setSpeed] = useState<number>(50);
  
  // Fetch data
  const { data: areasData } = useQuery({
    queryKey: ['/api/aoi'],
    refetchInterval: 5000,
  });
  
  const { data: celestialData } = useQuery({
    queryKey: ['/api/celestial'],
    refetchInterval: 2000,
  });
  
  const { data: npcData } = useQuery({
    queryKey: ['/api/npc/fleets'],
    refetchInterval: 2000,
  });
  
  const { data: playersData } = useQuery({
    queryKey: ['/api/simulated-players'],
    refetchInterval: 2000,
  });
  
  // Extract data
  const areas = areasData?.success ? areasData.data || [] : [];
  const celestialBodies = celestialData?.success ? celestialData.data || [] : [];
  const npcs = npcData?.success ? npcData.data || [] : [];
  
  // Get other players (simulated)
  const otherPlayers = playersData?.success ? playersData.data || [] : [];
  
  // Find Earth in celestial bodies
  const earth = celestialBodies.find(body => body.name === 'Earth');
  
  // Register simulated player with server
  const registerWithServer = async () => {
    if (isRegistered) return;
    
    try {
      // Position client near Earth if Earth is found
      if (earth) {
        setClient(prev => ({
          ...prev,
          position: {
            x: earth.currentPositionX || 0,
            y: earth.currentPositionY || 0,
            z: earth.currentPositionZ || 0,
          }
        }));
      }
      
      // Create a simulated player on server side
      const response = await fetch('/api/simulated-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 1,
          areaId: selectedArea || 'area-1'
        }),
      });
      
      if (response.ok) {
        setIsRegistered(true);
        console.log('Player registered with server');
      } else {
        console.error('Failed to register player with server');
      }
    } catch (error) {
      console.error('Error registering player:', error);
    }
  };
  
  // Movement handlers
  const handleMoveForward = () => {
    setClient(prev => {
      const speedFactor = speed / 50; // 50% is normal speed
      const newVelZ = prev.velocity.z - Math.cos(prev.rotation.y) * speedFactor;
      const newVelX = prev.velocity.x + Math.sin(prev.rotation.y) * speedFactor;
      
      return {
        ...prev,
        velocity: {
          ...prev.velocity,
          x: newVelX,
          z: newVelZ,
        }
      };
    });
  };
  
  const handleMoveBackward = () => {
    setClient(prev => {
      const speedFactor = speed / 50; // 50% is normal speed
      const newVelZ = prev.velocity.z + Math.cos(prev.rotation.y) * speedFactor;
      const newVelX = prev.velocity.x - Math.sin(prev.rotation.y) * speedFactor;
      
      return {
        ...prev,
        velocity: {
          ...prev.velocity,
          x: newVelX,
          z: newVelZ,
        }
      };
    });
  };
  
  const handleMoveLeft = () => {
    setClient(prev => {
      const speedFactor = speed / 50; // 50% is normal speed
      const newVelZ = prev.velocity.z - Math.sin(prev.rotation.y) * speedFactor;
      const newVelX = prev.velocity.x - Math.cos(prev.rotation.y) * speedFactor;
      
      return {
        ...prev,
        velocity: {
          ...prev.velocity,
          x: newVelX,
          z: newVelZ,
        }
      };
    });
  };
  
  const handleMoveRight = () => {
    setClient(prev => {
      const speedFactor = speed / 50; // 50% is normal speed
      const newVelZ = prev.velocity.z + Math.sin(prev.rotation.y) * speedFactor;
      const newVelX = prev.velocity.x + Math.cos(prev.rotation.y) * speedFactor;
      
      return {
        ...prev,
        velocity: {
          ...prev.velocity,
          x: newVelX,
          z: newVelZ,
        }
      };
    });
  };
  
  const handleRotateLeft = () => {
    setClient(prev => ({
      ...prev,
      rotation: {
        ...prev.rotation,
        y: prev.rotation.y - 0.1,
      }
    }));
  };
  
  const handleRotateRight = () => {
    setClient(prev => ({
      ...prev,
      rotation: {
        ...prev.rotation,
        y: prev.rotation.y + 0.1,
      }
    }));
  };
  
  const handleSelectArea = (areaId: string) => {
    setSelectedArea(areaId);
    
    // Find the selected area
    const area = areas.find(a => a.areaId === areaId);
    if (area) {
      // Move client to the area's center if available, or use default position
      setClient(prev => {
        // Check if area has center property with coordinates
        const centerX = area.center?.x || 0;
        const centerY = area.center?.y || 0;
        const centerZ = area.center?.z || 0;
        
        return {
          ...prev,
          position: {
            x: centerX,
            y: centerY,
            z: centerZ,
          },
          velocity: { x: 0, y: 0, z: 0 },
          areaId: areaId,
        };
      });
    }
  };
  
  // Update client position based on velocity
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setClient(prev => {
        // Update position based on velocity
        const newPosition = {
          x: prev.position.x + prev.velocity.x,
          y: prev.position.y + prev.velocity.y,
          z: prev.position.z + prev.velocity.z,
        };
        
        // Apply velocity damping (friction)
        const damping = 0.98;
        const newVelocity = {
          x: prev.velocity.x * damping,
          y: prev.velocity.y * damping,
          z: prev.velocity.z * damping,
        };
        
        return {
          ...prev,
          position: newPosition,
          velocity: newVelocity,
        };
      });
    }, 50); // 20 updates per second
    
    return () => clearInterval(updateInterval);
  }, []);
  
  // Set initial area if none selected and areas loaded
  useEffect(() => {
    if (areas.length > 0 && !selectedArea) {
      handleSelectArea(areas[0].areaId);
    }
  }, [areas, selectedArea]);
  
  // Register with server when Earth is found and area is selected
  useEffect(() => {
    if (earth && selectedArea && !isRegistered) {
      registerWithServer();
    }
  }, [earth, selectedArea, isRegistered]);
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Client Simulator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Game View</CardTitle>
              <CardDescription>
                Client-side view of the game world. Controls are on the right.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientView 
                client={client}
                celestialBodies={celestialBodies}
                npcs={npcs}
                otherPlayers={otherPlayers}
                selectedArea={selectedArea}
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              The view is centered on your position. Controls affect velocity and rotation.
            </CardFooter>
          </Card>
          
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Client Stats</TabsTrigger>
              <TabsTrigger value="nearby">Nearby Objects</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="pt-4">
              <ClientStats client={client} />
            </TabsContent>
            <TabsContent value="nearby" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nearby Objects</CardTitle>
                  <CardDescription>
                    Objects currently within your area of interest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Type</th>
                          <th className="text-left pb-2">Name</th>
                          <th className="text-left pb-2">Distance</th>
                          <th className="text-right pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {celestialBodies.slice(0, 5).map((body, index) => {
                          // Calculate distance
                          const dx = (body.position?.x || 0) - (client?.position?.x || 0);
                          const dy = (body.position?.y || 0) - (client?.position?.y || 0);
                          const dz = (body.position?.z || 0) - (client?.position?.z || 0);
                          const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                          
                          return (
                            <tr key={body.id || index} className="border-b">
                              <td className="py-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  Celestial
                                </Badge>
                              </td>
                              <td className="py-2">{body.name}</td>
                              <td className="py-2">{Math.round(distance).toLocaleString()} km</td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="sm">
                                  <Target className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {npcs.slice(0, 5).map((npc, index) => {
                          // Calculate distance
                          const dx = (npc.position?.x || 0) - (client?.position?.x || 0);
                          const dy = (npc.position?.y || 0) - (client?.position?.y || 0);
                          const dz = (npc.position?.z || 0) - (client?.position?.z || 0);
                          const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                          
                          return (
                            <tr key={npc.id || index} className="border-b">
                              <td className="py-2">
                                <Badge variant="outline" className={
                                  npc.type === 'enemy' ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                                  npc.type === 'transport' ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                                  npc.type === 'mining' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                                  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                }>
                                  {npc.type}
                                </Badge>
                              </td>
                              <td className="py-2">Ship {npc.id || index}</td>
                              <td className="py-2">{Math.round(distance).toLocaleString()} km</td>
                              <td className="py-2 text-right">
                                <Button variant="ghost" size="sm">
                                  <Target className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="col-span-1">
          <ClientControls 
            onMoveForward={handleMoveForward}
            onMoveBackward={handleMoveBackward}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
            onRotateLeft={handleRotateLeft}
            onRotateRight={handleRotateRight}
            onSelectArea={handleSelectArea}
            onSpeedChange={setSpeed}
            selectedArea={selectedArea}
            areas={areas}
            speed={speed}
            client={client}
            isRegistered={isRegistered}
            onRegister={registerWithServer}
          />
        </div>
      </div>
    </div>
  );
}