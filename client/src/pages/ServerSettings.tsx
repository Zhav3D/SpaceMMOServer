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

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
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
                    <p className="font-mono">{serverStatus.data.cpuUsage.toFixed(1)}%</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-gray-400">Memory Usage</p>
                    <p className="font-mono">{Math.round(serverStatus.data.memoryUsage / 1024 / 1024)} MB</p>
                  </div>
                </>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2"
                    disabled={!serverStatus?.success || serverStatus.data.status !== 'online'}
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
        
        <Card className="bg-background-dark border-gray-800 shadow-lg lg:col-span-2">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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