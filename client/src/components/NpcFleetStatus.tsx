import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell 
} from "@/components/ui/table";

interface NpcFleet {
  id: number;
  fleetId: string;
  type: 'enemy' | 'transport' | 'civilian' | 'mining';
  status: 'hostile' | 'en-route' | 'passive' | 'working';
  count: number;
  location: string;
  nearestCelestialBodyId: number;
}

interface NpcFleetStatusProps {
  fleets: NpcFleet[];
  isLoading?: boolean;
}

export default function NpcFleetStatus({
  fleets,
  isLoading = false,
}: NpcFleetStatusProps) {
  // Helper to get appropriate badge color based on fleet status
  const getStatusColor = (status: NpcFleet['status']): string => {
    switch (status) {
      case 'hostile': return 'destructive';
      case 'en-route': return 'warning';
      case 'working': return 'secondary';
      case 'passive': return 'outline';
      default: return 'outline';
    }
  };
  
  // Helper to get appropriate icon based on fleet type
  const getFleetTypeIcon = (type: NpcFleet['type']): string => {
    switch (type) {
      case 'enemy': return 'warning';
      case 'transport': return 'local_shipping';
      case 'civilian': return 'groups';
      case 'mining': return 'science';
      default: return 'question_mark';
    }
  };
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg h-full">
      <CardHeader className="border-b border-gray-800 py-3 px-4">
        <CardTitle className="text-base font-medium">NPC Fleets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="w-[90px]">Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[80px]">Count</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleets.length > 0 ? (
                fleets.map((fleet) => (
                  <TableRow key={fleet.fleetId} className="border-gray-800 hover:bg-gray-800/30">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="material-icons text-lg">{getFleetTypeIcon(fleet.type)}</span>
                        <span className="capitalize">{fleet.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {fleet.location}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">{fleet.count}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(fleet.status)} className="capitalize">
                        {fleet.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-gray-400">
                    No NPC fleets available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}