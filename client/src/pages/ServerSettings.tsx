import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { useServerContext } from "@/contexts/ServerContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ServerSettings() {
  const { toast } = useToast();
  const { serverStatus } = useServerContext();

  // Server settings
  const [maxPlayers, setMaxPlayers] = useState("2000");
  const [udpPort, setUdpPort] = useState("7777");
  const [tickRate, setTickRate] = useState("30");
  const [updateRate, setUpdateRate] = useState("10");
  const [aoiRadius, setAoiRadius] = useState("10000");
  const [aoiMaxEntities, setAoiMaxEntities] = useState("500");
  const [sanityCheckFrequency, setSanityCheckFrequency] = useState("10");

  // Binary protocol settings
  const [useBinaryProtocol, setUseBinaryProtocol] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  
  // World persistence settings
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState("300");
  
  // Frozen solar system state
  const [frozenSolarSystem, setFrozenSolarSystem] = useState(false);

  // Fetch current settings
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Fetch auto-save settings
  const { data: autoSaveData, isLoading: isLoadingAutoSave } = useQuery({
    queryKey: ['/api/settings/auto-save'],
  });
  
  // Fetch frozen solar system state
  const { data: frozenSolarData, isLoading: isLoadingFrozen } = useQuery({
    queryKey: ['/api/celestial/frozen'],
  });

  // Update settings with the fetched values when available
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const settings = settingsData.data;
      setMaxPlayers(String(settings.maxPlayers));
      setUdpPort(String(settings.udpPort));
      setTickRate(String(settings.tickRate));
      setUpdateRate(String(settings.updateRate));
      setAoiRadius(String(settings.aoiRadius));
      setAoiMaxEntities(String(settings.aoiMaxEntities));
      setSanityCheckFrequency(String(settings.sanityCheckFrequency));
      setUseBinaryProtocol(settings.useBinaryProtocol);
      setCompressionEnabled(settings.compressionEnabled);
      setEncryptionEnabled(settings.encryptionEnabled);
    }
  }, [settingsData]);
  
  // Update auto-save settings
  useEffect(() => {
    if (autoSaveData?.success && autoSaveData.data) {
      setAutoSaveEnabled(autoSaveData.data.enabled);
      setAutoSaveInterval(String(autoSaveData.data.interval));
    }
  }, [autoSaveData]);
  
  // Update frozen solar system state
  useEffect(() => {
    if (frozenSolarData?.success && frozenSolarData.data) {
      setFrozenSolarSystem(frozenSolarData.data.frozen);
    }
  }, [frozenSolarData]);

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Server settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for emergency stop
  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/emergency-stop', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency Stop",
        description: "Server has been emergency stopped.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to emergency stop: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings = {
      maxPlayers: parseInt(maxPlayers, 10),
      udpPort: parseInt(udpPort, 10),
      tickRate: parseInt(tickRate, 10),
      updateRate: parseInt(updateRate, 10),
      aoiRadius: parseInt(aoiRadius, 10),
      aoiMaxEntities: parseInt(aoiMaxEntities, 10),
      sanityCheckFrequency: parseInt(sanityCheckFrequency, 10),
      useBinaryProtocol,
      compressionEnabled,
      encryptionEnabled,
    };
    
    updateSettingsMutation.mutate(settings);
  };

  const handleEmergencyStop = () => {
    emergencyStopMutation.mutate();
  };

  // Mutation for updating auto-save settings
  const updateAutoSaveMutation = useMutation({
    mutationFn: async ({ enabled, interval }: { enabled: boolean; interval: number }) => {
      const response = await fetch('/api/settings/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled, interval }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/auto-save'] });
      toast({
        title: "Auto-Save Settings Updated",
        description: "Auto-save settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update auto-save settings: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for toggling frozen solar system
  const toggleFrozenSolarSystemMutation = useMutation({
    mutationFn: async (frozen: boolean) => {
      const response = await fetch('/api/celestial/frozen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frozen }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/celestial/frozen'] });
      toast({
        title: "Solar System Mode Updated",
        description: frozenSolarSystem 
          ? "Solar system is now in frozen mode - planet positions are fixed."
          : "Solar system is now in dynamic mode - planets will continue their orbits.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update solar system mode: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for world state operations (save, load, reset)
  const worldStateMutation = useMutation({
    mutationFn: async ({ action }: { action: 'save' | 'load' | 'reset' }) => {
      const response = await fetch(`/api/world/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/celestial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/npc/fleets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/aoi'] });
      
      const actionMessages = {
        save: "World state has been saved successfully.",
        load: "World state has been loaded successfully.",
        reset: "World state has been reset to default."
      };
      
      toast({
        title: `World State ${variables.action.charAt(0).toUpperCase() + variables.action.slice(1)}`,
        description: actionMessages[variables.action],
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: `Failed to ${variables.action} world state: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveAutoSaveSettings = () => {
    updateAutoSaveMutation.mutate({ 
      enabled: autoSaveEnabled, 
      interval: parseInt(autoSaveInterval, 10)
    });
  };
  
  const handleToggleFrozenSolarSystem = (newValue: boolean) => {
    setFrozenSolarSystem(newValue);
    toggleFrozenSolarSystemMutation.mutate(newValue);
  };
  
  const handleWorldStateAction = (action: 'save' | 'load' | 'reset') => {
    worldStateMutation.mutate({ action });
  };
  
  const isLoading = isLoadingSettings || isLoadingAutoSave || isLoadingFrozen;
  
  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Server Settings</h1>
        <p className="text-gray-400">Configure game server parameters</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Server Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Current Status</p>
                {serverStatus?.success && (
                  <Badge variant={serverStatus.data.status === 'online' ? 'success' : 'destructive'}>
                    {serverStatus.data.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                )}
              </div>
              
              {serverStatus?.success && (
                <>
                  <div className="flex justify-between">
                    <p className="text-gray-400">Uptime</p>
                    <p className="font-mono">
                      {Math.floor(serverStatus.data.uptime / 3600)}h {Math.floor((serverStatus.data.uptime % 3600) / 60)}m
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-400">Connected Players</p>
                    <p className="font-mono">{serverStatus.data.playerCount} / {maxPlayers}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-400">CPU Usage</p>
                    <p className="font-mono">{serverStatus?.data?.cpuUsage ? serverStatus.data.cpuUsage.toFixed(1) : '0.0'}%</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-400">Memory Usage</p>
                    <p className="font-mono">{serverStatus?.data?.memoryUsage ? Math.round(serverStatus.data.memoryUsage / 1024 / 1024) : '0'} MB</p>
                  </div>
                </>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2"
                    disabled={!serverStatus?.success || !serverStatus?.data?.status || serverStatus.data.status !== 'online'}
                  >
                    Emergency Stop Server
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will immediately stop the server and disconnect all clients.
                      This is meant for emergency situations only.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleEmergencyStop}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Stop Server
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">World Persistence</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save" className="text-base">Auto-Save</Label>
                  <p className="text-sm text-gray-400">
                    Automatically save world state
                  </p>
                </div>
                <Switch 
                  id="auto-save" 
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auto-save-interval">Auto-Save Interval (seconds)</Label>
                <Input
                  id="auto-save-interval"
                  type="number"
                  className="bg-background border-gray-700"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(e.target.value)}
                  min="10"
                  disabled={!autoSaveEnabled}
                />
                <p className="text-xs text-gray-400">How often world state is automatically saved</p>
              </div>
              
              <Button 
                onClick={handleSaveAutoSaveSettings} 
                className="w-full bg-primary hover:bg-primary/80 mb-4"
                disabled={updateAutoSaveMutation.isPending}
              >
                {updateAutoSaveMutation.isPending ? "Saving..." : "Save Auto-Save Settings"}
              </Button>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => handleWorldStateAction('save')} 
                  className="w-full"
                  variant="outline"
                  disabled={worldStateMutation.isPending}
                >
                  Save World
                </Button>
                
                <Button 
                  onClick={() => handleWorldStateAction('load')} 
                  className="w-full"
                  variant="outline"
                  disabled={worldStateMutation.isPending}
                >
                  Load World
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      Reset World
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset world state?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will reset the world to its default state.
                        All custom celestial bodies, NPC fleets, and other entities will be deleted.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleWorldStateAction('reset')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Reset World
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Solar System Simulation</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="frozen-solar-system" className="text-base">Frozen Mode</Label>
                  <p className="text-sm text-gray-400">
                    Planets maintain fixed positions
                  </p>
                </div>
                <Switch 
                  id="frozen-solar-system" 
                  checked={frozenSolarSystem}
                  onCheckedChange={handleToggleFrozenSolarSystem}
                  disabled={toggleFrozenSolarSystemMutation.isPending}
                />
              </div>
              
              <div className="p-4 bg-background rounded-md border border-gray-700 mt-2">
                <h4 className="font-medium mb-2">{frozenSolarSystem ? "Frozen Mode" : "Dynamic Mode"}</h4>
                <p className="text-sm text-gray-400 mb-3">
                  {frozenSolarSystem 
                    ? "In frozen mode, celestial bodies maintain fixed positions, making navigation and gameplay more approachable for new players."
                    : "In dynamic mode, celestial bodies follow realistic orbital mechanics, creating a more realistic space environment."}
                </p>
                {frozenSolarSystem ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Fixed Positions
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
                    Orbital Mechanics
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg lg:col-span-3">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="max-players">Max Players</Label>
                <Input
                  id="max-players"
                  type="number"
                  className="bg-background border-gray-700"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min="1"
                  max="5000"
                />
                <p className="text-xs text-gray-400">Maximum number of concurrent players</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="udp-port">UDP Port</Label>
                <Input
                  id="udp-port"
                  type="number"
                  className="bg-background border-gray-700"
                  value={udpPort}
                  onChange={(e) => setUdpPort(e.target.value)}
                  min="1024"
                  max="65535"
                />
                <p className="text-xs text-gray-400">Port for UDP game communication</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tick-rate">Server Tick Rate (Hz)</Label>
                <Input
                  id="tick-rate"
                  type="number"
                  className="bg-background border-gray-700"
                  value={tickRate}
                  onChange={(e) => setTickRate(e.target.value)}
                  min="1"
                  max="120"
                />
                <p className="text-xs text-gray-400">Physics and simulation update frequency</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="update-rate">Network Update Rate (Hz)</Label>
                <Input
                  id="update-rate"
                  type="number"
                  className="bg-background border-gray-700"
                  value={updateRate}
                  onChange={(e) => setUpdateRate(e.target.value)}
                  min="1"
                  max="60"
                />
                <p className="text-xs text-gray-400">How often state is sent to clients</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aoi-radius">AOI Radius (units)</Label>
                <Input
                  id="aoi-radius"
                  type="number"
                  className="bg-background border-gray-700"
                  value={aoiRadius}
                  onChange={(e) => setAoiRadius(e.target.value)}
                  min="100"
                />
                <p className="text-xs text-gray-400">Area of Interest radius for state replication</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aoi-max-entities">AOI Max Entities</Label>
                <Input
                  id="aoi-max-entities"
                  type="number"
                  className="bg-background border-gray-700"
                  value={aoiMaxEntities}
                  onChange={(e) => setAoiMaxEntities(e.target.value)}
                  min="10"
                  max="2000"
                />
                <p className="text-xs text-gray-400">Maximum entities per AOI</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sanity-check-frequency">Sanity Check Frequency (1/n)</Label>
                <Input
                  id="sanity-check-frequency"
                  type="number"
                  className="bg-background border-gray-700"
                  value={sanityCheckFrequency}
                  onChange={(e) => setSanityCheckFrequency(e.target.value)}
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-400">1 check per N updates on average</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Network Protocol Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="binary-protocol" className="text-base">Binary Protocol</Label>
                  <p className="text-sm text-gray-400">
                    Use binary format instead of JSON
                  </p>
                </div>
                <Switch 
                  id="binary-protocol" 
                  checked={useBinaryProtocol}
                  onCheckedChange={setUseBinaryProtocol}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compression-enabled" className="text-base">Compression</Label>
                  <p className="text-sm text-gray-400">
                    Compress network packets
                  </p>
                </div>
                <Switch 
                  id="compression-enabled" 
                  checked={compressionEnabled}
                  onCheckedChange={setCompressionEnabled}
                  disabled={!useBinaryProtocol}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="encryption-enabled" className="text-base">Encryption</Label>
                  <p className="text-sm text-gray-400">
                    Encrypt network packets
                  </p>
                </div>
                <Switch 
                  id="encryption-enabled" 
                  checked={encryptionEnabled}
                  onCheckedChange={setEncryptionEnabled}
                  disabled={!useBinaryProtocol}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSettings} 
              className="w-full bg-primary hover:bg-primary/80"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Server Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}