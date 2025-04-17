import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NpcFleet {
  id: number;
  fleetId: string;
  type: string;
  status: string;
  count: number;
  location: string;
  nearestCelestialBodyId: number;
}

export default function Npcs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [spawnDialogOpen, setSpawnDialogOpen] = useState(false);
  const [newFleetType, setNewFleetType] = useState("civilian");
  const [newFleetCount, setNewFleetCount] = useState("100");
  const [newFleetLocation, setNewFleetLocation] = useState("Earth Orbit");
  const [newFleetCelestialId, setNewFleetCelestialId] = useState("3"); // Default to Earth
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();

  const { data: celestialData } = useQuery({
    queryKey: ['/api/celestial'],
    staleTime: 10000,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/npc/fleets'],
    staleTime: 5000,
  });

  const spawnFleetMutation = useMutation({
    mutationFn: (newFleet: any) => {
      return apiRequest('POST', '/api/npc/fleets', newFleet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/npc/fleets'] });
      setSpawnDialogOpen(false);
      toast({
        title: "Fleet Spawned",
        description: `Successfully spawned ${newFleetCount} ${newFleetType} ships at ${newFleetLocation}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to spawn fleet",
        variant: "destructive",
      });
      console.error("Error spawning fleet:", error);
    }
  });
  
  const deleteFleetMutation = useMutation({
    mutationFn: (fleetId: string) => {
      return apiRequest('DELETE', `/api/npc/fleets/${fleetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/npc/fleets'] });
      setDeleteDialogOpen(false);
      setFleetToDelete(null);
      toast({
        title: "Fleet Deleted",
        description: "The NPC fleet has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete fleet",
        variant: "destructive",
      });
      console.error("Error deleting fleet:", error);
    }
  });

  const handleSpawnFleet = () => {
    spawnFleetMutation.mutate({
      type: newFleetType,
      count: parseInt(newFleetCount, 10),
      location: newFleetLocation,
      nearestCelestialBodyId: parseInt(newFleetCelestialId, 10)
    });
  };
  
  const handleDeleteFleet = (fleetId: string) => {
    setFleetToDelete(fleetId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteFleet = () => {
    if (fleetToDelete) {
      deleteFleetMutation.mutate(fleetToDelete);
    }
  };
  
  // This effect will refetch fleets data when deleteFleetMutation completes
  useEffect(() => {
    if (deleteFleetMutation.isSuccess) {
      // Force refetch with fresh data
      refetch();
      console.log("Fleet deleted successfully, refreshing data");
    }
  }, [deleteFleetMutation.isSuccess, refetch]);

  const getBadgeColorForType = (type: string) => {
    switch (type) {
      case 'enemy': return 'bg-destructive';
      case 'transport': return 'bg-info';
      case 'civilian': return 'bg-success';
      case 'mining': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getBadgeColorForStatus = (status: string) => {
    switch (status) {
      case 'hostile': return 'bg-destructive/20 text-destructive';
      case 'en-route': return 'bg-info/20 text-info';
      case 'passive': return 'bg-success/20 text-success';
      case 'working': return 'bg-warning/20 text-warning';
      default: return 'bg-secondary/20 text-secondary';
    }
  };

  const filterFleets = (fleets: NpcFleet[]) => {
    if (!searchTerm) return fleets;
    
    const term = searchTerm.toLowerCase();
    return fleets.filter(fleet => 
      fleet.fleetId.toLowerCase().includes(term) || 
      fleet.type.toLowerCase().includes(term) ||
      fleet.status.toLowerCase().includes(term) ||
      fleet.location.toLowerCase().includes(term)
    );
  };

  const fleets = data?.success ? (data.data as NpcFleet[]) : [];
  const filteredFleets = filterFleets(fleets);
  const celestialBodies = celestialData?.success ? celestialData.data : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">NPC Control</h1>
        <p className="text-gray-400">Manage NPC fleets and behaviors</p>
      </div>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg mb-6">
        <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
          <CardTitle className="text-base font-medium">NPC Fleets</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              className="w-60 bg-background border-gray-700 text-sm"
              placeholder="Search fleets..."
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
            <Button 
              size="sm" 
              onClick={() => setSpawnDialogOpen(true)}
              className="bg-secondary hover:bg-secondary/80"
            >
              <span className="material-icons text-sm mr-1">add</span>
              Spawn Fleet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Loading NPC fleets...</div>
          ) : filteredFleets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[200px]">Fleet ID</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px]">Count</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[120px]">Celestial ID</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFleets.map((fleet) => (
                    <TableRow key={fleet.id} className="border-gray-800 hover:bg-gray-800/30">
                      <TableCell className="font-mono">{fleet.id}</TableCell>
                      <TableCell className="font-mono text-xs">{fleet.fleetId}</TableCell>
                      <TableCell>
                        <Badge className={`${getBadgeColorForType(fleet.type)} text-white`}>
                          {fleet.type.charAt(0).toUpperCase() + fleet.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getBadgeColorForStatus(fleet.status)}`}>
                          {fleet.status.charAt(0).toUpperCase() + fleet.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{fleet.count}</TableCell>
                      <TableCell>{fleet.location}</TableCell>
                      <TableCell className="font-mono">{fleet.nearestCelestialBodyId}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteFleet(fleet.fleetId)}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              {searchTerm ? "No fleets match your search" : "No NPC fleets found"}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={spawnDialogOpen} onOpenChange={setSpawnDialogOpen}>
        <DialogContent className="bg-background-dark border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Spawn NPC Fleet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new fleet of NPC ships in the game world.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fleet-type">Fleet Type</Label>
                <Select value={newFleetType} onValueChange={setNewFleetType}>
                  <SelectTrigger id="fleet-type" className="bg-background border-gray-700">
                    <SelectValue placeholder="Select fleet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enemy">Enemy</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="civilian">Civilian</SelectItem>
                    <SelectItem value="mining">Mining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fleet-count">Ship Count</Label>
                <Input
                  id="fleet-count"
                  type="number"
                  className="bg-background border-gray-700"
                  value={newFleetCount}
                  onChange={(e) => setNewFleetCount(e.target.value)}
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fleet-location">Location Description</Label>
              <Input
                id="fleet-location"
                className="bg-background border-gray-700"
                value={newFleetLocation}
                onChange={(e) => setNewFleetLocation(e.target.value)}
                placeholder="e.g. Earth Orbit, Mars Colony"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="celestial-body">Nearest Celestial Body</Label>
              <Select value={newFleetCelestialId} onValueChange={setNewFleetCelestialId}>
                <SelectTrigger id="celestial-body" className="bg-background border-gray-700">
                  <SelectValue placeholder="Select celestial body" />
                </SelectTrigger>
                <SelectContent>
                  {celestialBodies && celestialBodies.map((body: any) => (
                    <SelectItem key={body.id} value={body.id.toString()}>
                      {body.name} (ID: {body.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpawnDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSpawnFleet}
              disabled={spawnFleetMutation.isPending}
              className="bg-secondary hover:bg-secondary/80"
            >
              {spawnFleetMutation.isPending ? "Spawning..." : "Spawn Fleet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background-dark border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete NPC Fleet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this fleet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm font-mono bg-background p-2 rounded">
              Fleet ID: {fleetToDelete}
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteFleet}
              disabled={deleteFleetMutation.isPending}
            >
              {deleteFleetMutation.isPending ? "Deleting..." : "Delete Fleet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
