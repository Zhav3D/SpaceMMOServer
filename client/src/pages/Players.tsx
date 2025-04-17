import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Player {
  id: number;
  userId: number;
  clientId: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationW: number;
  nearestCelestialBodyId: number;
  lastUpdate: number;
  isConnected: boolean;
  ipAddress: string;
  port: number;
}

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/players'],
    staleTime: 5000,
  });

  const handleViewDetails = (player: Player) => {
    setSelectedPlayer(player);
    setShowDetailsDialog(true);
  };

  const formatVector = (x: number, y: number, z: number) => {
    return `(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
  };

  const formatRotation = (x: number, y: number, z: number, w: number) => {
    return `(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}, ${w.toFixed(2)})`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filterPlayers = (players: Player[]) => {
    if (!searchTerm) return players;
    
    const term = searchTerm.toLowerCase();
    return players.filter(player => 
      player.clientId.toLowerCase().includes(term) || 
      player.ipAddress.toLowerCase().includes(term) ||
      player.id.toString().includes(term) ||
      player.userId.toString().includes(term)
    );
  };

  const players = data?.success ? (data.data as Player[]) : [];
  const filteredPlayers = filterPlayers(players);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Player Management</h1>
        <p className="text-gray-400">Monitor and manage connected players</p>
      </div>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg mb-6">
        <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
          <CardTitle className="text-base font-medium">Connected Players</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              className="w-60 bg-background border-gray-700 text-sm"
              placeholder="Search by client ID or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="text-secondary border-secondary hover:bg-secondary/10"
            >
              <span className="material-icons text-sm mr-1">refresh</span>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Loading players...</div>
          ) : filteredPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[200px]">Client ID</TableHead>
                    <TableHead className="w-[150px]">IP Address</TableHead>
                    <TableHead className="w-[150px]">Last Update</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[150px]">Location</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id} className="border-gray-800 hover:bg-gray-800/30">
                      <TableCell className="font-mono">{player.id}</TableCell>
                      <TableCell className="font-mono text-xs">{player.clientId.substring(0, 12)}...</TableCell>
                      <TableCell>{player.ipAddress}</TableCell>
                      <TableCell>{formatTimeSince(player.lastUpdate)}</TableCell>
                      <TableCell>
                        {player.isConnected ? (
                          <Badge variant="default" className="bg-success text-white">Connected</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">Disconnected</Badge>
                        )}
                      </TableCell>
                      <TableCell>Near celestial ID: {player.nearestCelestialBodyId}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDetails(player)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <span className="material-icons text-sm">visibility</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              {searchTerm ? "No players match your search" : "No players connected"}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-background-dark border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Player Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed information about the selected player.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Basic Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono">{selectedPlayer.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User ID:</span>
                      <span className="font-mono">{selectedPlayer.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client ID:</span>
                      <span className="font-mono">{selectedPlayer.clientId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span className="font-mono">{selectedPlayer.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Port:</span>
                      <span className="font-mono">{selectedPlayer.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-mono">{selectedPlayer.isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Location Data</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="font-mono">
                        {formatVector(selectedPlayer.positionX, selectedPlayer.positionY, selectedPlayer.positionZ)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Velocity:</span>
                      <span className="font-mono">
                        {formatVector(selectedPlayer.velocityX, selectedPlayer.velocityY, selectedPlayer.velocityZ)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rotation:</span>
                      <span className="font-mono">
                        {formatRotation(
                          selectedPlayer.rotationX, 
                          selectedPlayer.rotationY, 
                          selectedPlayer.rotationZ,
                          selectedPlayer.rotationW
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Near Celestial:</span>
                      <span className="font-mono">{selectedPlayer.nearestCelestialBodyId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="font-mono">{formatTimestamp(selectedPlayer.lastUpdate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
