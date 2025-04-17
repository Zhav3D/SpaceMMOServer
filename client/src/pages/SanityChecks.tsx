import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useServerContext } from "@/contexts/ServerContext";

// Fake sanity check failures for UI demonstration
// In a real app, this would come from the API
const MOCK_FAILURES = [
  {
    id: 1,
    timestamp: Date.now() - 256000,
    playerId: "client-9f81d-e722b",
    playerName: "SpaceCommander42",
    checkType: "position",
    expected: "(24156.23, 1836.45, -9273.11)",
    received: "(82713.59, 1836.45, -9273.11)",
    reason: "Position too far from expected",
    action: "teleported_to_valid"
  },
  {
    id: 2,
    timestamp: Date.now() - 485000,
    playerId: "client-2a37c-f19d4",
    playerName: "GalacticPilot",
    checkType: "velocity",
    expected: "max 1000 units/s",
    received: "1834.72 units/s",
    reason: "Velocity magnitude too high",
    action: "velocity_clamped"
  },
  {
    id: 3,
    timestamp: Date.now() - 1256000,
    playerId: "client-6e104-a37b2",
    playerName: "StarDuster99",
    checkType: "acceleration",
    expected: "max 500 units/s²",
    received: "947.36 units/s²",
    reason: "Acceleration magnitude too high",
    action: "acceleration_clamped"
  }
];

export default function SanityChecks() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [frequency, setFrequency] = useState("10");
  const [maxVelocity, setMaxVelocity] = useState("1000");
  const [maxAcceleration, setMaxAcceleration] = useState("500");
  const [positionTolerance, setPositionTolerance] = useState("10");
  
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  const { serverStatus } = useServerContext();

  // In a real app, we would fetch this from the API
  const sanityCheckFrequency = settings?.success ? settings.data.sanityCheckFrequency : parseInt(frequency, 10);
  const activeChecks = 0; // Would come from the API

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getBadgeColor = (checkType: string) => {
    switch (checkType) {
      case 'position': return 'bg-info/20 text-info';
      case 'velocity': return 'bg-warning/20 text-warning';
      case 'acceleration': return 'bg-error/20 text-error';
      case 'collision': return 'bg-secondary/20 text-secondary';
      default: return 'bg-primary/20 text-primary';
    }
  };

  const handleSaveSettings = () => {
    // In a real app, we would call the API to save the settings
    console.log("Saving sanity check settings:", {
      enabled: isEnabled,
      frequency,
      maxVelocity,
      maxAcceleration,
      positionTolerance
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Sanity Checks</h1>
        <p className="text-gray-400">Server-side validation of client state</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Recent Sanity Check Failures</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[120px]">Player</TableHead>
                    <TableHead className="w-[120px]">Check Type</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead className="w-[150px]">Action Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_FAILURES.map((failure) => (
                    <TableRow key={failure.id} className="border-gray-800 hover:bg-gray-800/30">
                      <TableCell>{formatTimestamp(failure.timestamp)}</TableCell>
                      <TableCell>{failure.playerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getBadgeColor(failure.checkType)}>
                          {failure.checkType.charAt(0).toUpperCase() + failure.checkType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{failure.reason}</div>
                          <div className="text-xs text-gray-400">
                            Expected: {failure.expected}, Received: {failure.received}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {failure.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-background-dark border-gray-800 shadow-lg mb-6">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Sanity Check Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Status</h3>
                    <p className="text-sm text-gray-400">
                      {isEnabled ? 
                        "Actively validating client state" : 
                        "Client state validation disabled"
                      }
                    </p>
                  </div>
                  <div>
                    {serverStatus?.success && serverStatus.data.status === 'online' ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="text-sm text-gray-400">Check Frequency</div>
                  <div className="text-xl font-mono">1/{sanityCheckFrequency}</div>
                  <div className="text-xs text-gray-500">1 check per {sanityCheckFrequency} updates on average</div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="text-sm text-gray-400">Active Checks</div>
                  <div className="text-xl font-mono">{activeChecks}</div>
                  <div className="text-xs text-gray-500">Waiting for client response</div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="text-sm text-gray-400">Failure Rate</div>
                  <div className="text-xl font-mono">0.0021%</div>
                  <div className="text-xs text-gray-500">Last 24 hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Configure Sanity Checks</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sanity-check-enabled" className="text-base">Enabled</Label>
                    <p className="text-sm text-gray-400">
                      Turn validation on/off
                    </p>
                  </div>
                  <Switch 
                    id="sanity-check-enabled" 
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="check-frequency">Check Frequency (1/n updates)</Label>
                  <Input
                    id="check-frequency"
                    type="number"
                    className="bg-background border-gray-700"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-velocity">Max Velocity (units/s)</Label>
                  <Input
                    id="max-velocity"
                    type="number"
                    className="bg-background border-gray-700"
                    value={maxVelocity}
                    onChange={(e) => setMaxVelocity(e.target.value)}
                    min="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-acceleration">Max Acceleration (units/s²)</Label>
                  <Input
                    id="max-acceleration"
                    type="number"
                    className="bg-background border-gray-700"
                    value={maxAcceleration}
                    onChange={(e) => setMaxAcceleration(e.target.value)}
                    min="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position-tolerance">Position Tolerance (units)</Label>
                  <Input
                    id="position-tolerance"
                    type="number"
                    className="bg-background border-gray-700"
                    value={positionTolerance}
                    onChange={(e) => setPositionTolerance(e.target.value)}
                    min="1"
                  />
                </div>
                
                <Button 
                  onClick={handleSaveSettings}
                  className="w-full bg-secondary hover:bg-secondary/80"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
