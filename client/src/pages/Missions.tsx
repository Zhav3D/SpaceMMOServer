import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Edit, Trash2, Users } from 'lucide-react';
import { MissionType, MissionStatus } from '@shared/types';

interface MissionState {
  missionId: string;
  name: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  reward: number;
  difficulty: number;
  startLocationId: number;
  endLocationId: number;
  assignedFleetId?: string;
  progressValue: number;
  progressTarget: number;
  startTime: number;
  expiryTime: number;
  completeTime?: number;
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

const getTimeRemaining = (expiryTime: number): string => {
  const now = Date.now() / 1000;
  const remaining = expiryTime - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getMissionTypeIcon = (type: MissionType) => {
  switch (type) {
    case 'combat':
      return '🔥';
    case 'trade':
      return '💰';
    case 'mining':
      return '⛏️';
    case 'escort':
      return '🛡️';
    case 'exploration':
      return '🔭';
    case 'delivery':
      return '📦';
    case 'rescue':
      return '🚨';
    case 'patrol':
      return '👁️';
    default:
      return '🚀';
  }
};

const getDifficultyText = (difficulty: number) => {
  switch (difficulty) {
    case 1: return 'Easy';
    case 2: return 'Moderate';
    case 3: return 'Medium';
    case 4: return 'Hard';
    case 5: return 'Very Hard';
    default: return `Level ${difficulty}`;
  }
};

const getMissionStatusColor = (status: MissionStatus) => {
  switch (status) {
    case 'active': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    case 'expired': return 'bg-yellow-500';
    case 'abandoned': return 'bg-gray-500';
    default: return 'bg-purple-500';
  }
};

const MissionTypeTag: React.FC<{ type: MissionType }> = ({ type }) => {
  let bgColor = '';
  
  switch (type) {
    case 'combat':
      bgColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    case 'trade':
      bgColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'mining':
      bgColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      break;
    case 'escort':
      bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'exploration':
      bgColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'delivery':
      bgColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      break;
    case 'patrol':
      bgColor = 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300';
      break;
    case 'rescue':
      bgColor = 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300';
      break;
    default:
      bgColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
  
  return (
    <Badge variant="outline" className={`${bgColor} font-medium`}>
      {getMissionTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

const MissionDetailCard: React.FC<{ mission: MissionState }> = ({ mission }) => {
  const timeRemaining = mission.status === 'active' ? getTimeRemaining(mission.expiryTime) : '';
  const progressPercentage = Math.round((mission.progressValue / mission.progressTarget) * 100) || 0;
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">{mission.name}</CardTitle>
          <CardDescription className="mt-1">{mission.description}</CardDescription>
        </div>
        <MissionTypeTag type={mission.type} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Difficulty:</span>
            <span className="font-medium">{getDifficultyText(mission.difficulty)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Reward:</span>
            <span className="font-medium">{mission.reward.toLocaleString()} Credits</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Assigned Fleet:</span>
            <span className="font-medium">{mission.assignedFleetId || 'None'}</span>
          </div>
          {mission.status === 'active' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time Remaining:</span>
                <span className="font-medium flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {timeRemaining}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </>
          )}
          {mission.status === 'completed' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed:</span>
              <span className="font-medium">{mission.completeTime ? formatTimestamp(mission.completeTime) : 'Unknown'}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Started: {formatTimestamp(mission.startTime)}
        </div>
        <Badge variant={mission.status === 'active' ? 'default' : mission.status === 'completed' ? 'outline' : 'destructive'}>
          {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
        </Badge>
      </CardFooter>
    </Card>
  );
};

const MissionTable: React.FC<{ 
  missions: MissionState[], 
  title: string,
  onDelete?: (mission: MissionState) => void,
  onAssign?: (mission: MissionState) => void
}> = ({ missions, title, onDelete, onAssign }) => {
  if (!missions.length) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No missions</AlertTitle>
        <AlertDescription>
          There are no {title.toLowerCase()} missions at this time.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Table>
      <TableCaption>{title}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Type</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Reward</TableHead>
          <TableHead>Fleet</TableHead>
          <TableHead className="text-right">Progress</TableHead>
          {title === 'Active Missions' && <TableHead className="text-right">Time Left</TableHead>}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {missions.map((mission) => (
          <TableRow key={mission.missionId}>
            <TableCell><MissionTypeTag type={mission.type} /></TableCell>
            <TableCell className="font-medium">{mission.name}</TableCell>
            <TableCell>{getDifficultyText(mission.difficulty)}</TableCell>
            <TableCell>{mission.reward.toLocaleString()}</TableCell>
            <TableCell>{mission.assignedFleetId || 'None'}</TableCell>
            <TableCell className="text-right">
              {mission.status === 'active' && (
                <div className="flex items-center justify-end space-x-2">
                  <span>{Math.round((mission.progressValue / mission.progressTarget) * 100)}%</span>
                  <Progress className="w-[60px] h-2" value={(mission.progressValue / mission.progressTarget) * 100} />
                </div>
              )}
              {mission.status === 'completed' && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
              {mission.status === 'failed' && <AlertTriangle className="ml-auto h-4 w-4 text-red-500" />}
            </TableCell>
            {title === 'Active Missions' && (
              <TableCell className="text-right">{getTimeRemaining(mission.expiryTime)}</TableCell>
            )}
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                {mission.status === 'active' && onAssign && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAssign(mission)}
                    title="Assign Fleet"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDelete(mission)}
                    title="Delete Mission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function Missions() {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [selectedMission, setSelectedMission] = useState<MissionState | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch missions data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/missions'],
    refetchInterval: 5000, // Refresh mission data every 5 seconds
  });
  
  // Fetch available fleets for assignment
  const { data: fleetData } = useQuery({
    queryKey: ['/api/npc/fleets'],
    staleTime: 10000,
  });
  
  // Delete mission mutation
  const deleteMissionMutation = useMutation({
    mutationFn: (missionId: string) => {
      return apiRequest('DELETE', `/api/missions/${missionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Mission Deleted",
        description: "The mission has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete mission",
        variant: "destructive",
      });
      console.error("Error deleting mission:", error);
    }
  });
  
  // Assign fleet to mission mutation
  const assignFleetMutation = useMutation({
    mutationFn: ({ missionId, fleetId }: { missionId: string, fleetId: string }) => {
      return apiRequest('PUT', `/api/missions/${missionId}/assign`, { fleetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      setIsAssignDialogOpen(false);
      toast({
        title: "Fleet Assigned",
        description: "The fleet has been successfully assigned to the mission.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign fleet to mission",
        variant: "destructive",
      });
      console.error("Error assigning fleet to mission:", error);
    }
  });
  
  const handleDeleteMission = (mission: MissionState) => {
    setSelectedMission(mission);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteMission = () => {
    if (selectedMission) {
      deleteMissionMutation.mutate(selectedMission.missionId);
    }
  };
  
  const handleAssignFleet = (mission: MissionState) => {
    setSelectedMission(mission);
    setSelectedFleetId(mission.assignedFleetId || '');
    setIsAssignDialogOpen(true);
  };
  
  const confirmAssignFleet = () => {
    if (selectedMission && selectedFleetId) {
      assignFleetMutation.mutate({ 
        missionId: selectedMission.missionId, 
        fleetId: selectedFleetId 
      });
    }
  };
  
  // Available fleets for dropdown
  const availableFleets = fleetData?.success ? fleetData.data as any[] : [];
  
  // This effect will refetch missions data when a mutation completes
  useEffect(() => {
    if (deleteMissionMutation.isSuccess || assignFleetMutation.isSuccess) {
      // Force refetch with fresh data
      refetch();
    }
  }, [deleteMissionMutation.isSuccess, assignFleetMutation.isSuccess, refetch]);
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Mission Control</h1>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Mission Control</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load mission data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const { active = [], completed = [], failed = [] } = data?.data || {};
  
  const totalActiveMissions = active.length;
  const totalCompletedMissions = completed.length;
  const totalFailedMissions = failed.length;
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'} 
            onClick={() => setViewMode('card')}
            size="sm"
          >
            Card View
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            onClick={() => setViewMode('table')}
            size="sm"
          >
            Table View
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalActiveMissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCompletedMissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Failed Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFailedMissions}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Missions</TabsTrigger>
          <TabsTrigger value="completed">Completed Missions</TabsTrigger>
          <TabsTrigger value="failed">Failed Missions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {active.map(mission => (
                <MissionDetailCard key={mission.missionId} mission={mission} />
              ))}
              {active.length === 0 && (
                <Alert variant="default" className="col-span-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No active missions</AlertTitle>
                  <AlertDescription>
                    There are no active missions at this time.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <MissionTable 
              missions={active} 
              title="Active Missions" 
              onDelete={handleDeleteMission}
              onAssign={handleAssignFleet}
            />
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completed.map(mission => (
                <MissionDetailCard key={mission.missionId} mission={mission} />
              ))}
              {completed.length === 0 && (
                <Alert variant="default" className="col-span-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No completed missions</AlertTitle>
                  <AlertDescription>
                    There are no completed missions yet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <MissionTable 
              missions={completed} 
              title="Completed Missions" 
              onDelete={handleDeleteMission}
            />
          )}
        </TabsContent>
        
        <TabsContent value="failed">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {failed.map(mission => (
                <MissionDetailCard key={mission.missionId} mission={mission} />
              ))}
              {failed.length === 0 && (
                <Alert variant="default" className="col-span-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No failed missions</AlertTitle>
                  <AlertDescription>
                    There are no failed missions yet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <MissionTable 
              missions={failed} 
              title="Failed Missions" 
              onDelete={handleDeleteMission}
            />
          )}
        </TabsContent>
        
        {/* Delete Mission Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Mission</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this mission? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedMission && (
              <div className="py-4">
                <p><strong>Name:</strong> {selectedMission.name}</p>
                <p><strong>Type:</strong> {selectedMission.type}</p>
                <p><strong>Status:</strong> {selectedMission.status}</p>
                {selectedMission.assignedFleetId && (
                  <p className="text-amber-600">
                    This mission has a fleet assigned to it: {selectedMission.assignedFleetId}
                  </p>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteMissionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteMission}
                disabled={deleteMissionMutation.isPending}
              >
                {deleteMissionMutation.isPending ? "Deleting..." : "Delete Mission"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Assign Fleet Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Fleet to Mission</DialogTitle>
              <DialogDescription>
                Select a fleet to assign to this mission. If the mission already has a fleet, it will be reassigned.
              </DialogDescription>
            </DialogHeader>
            {selectedMission && (
              <div className="py-4">
                <p><strong>Mission:</strong> {selectedMission.name}</p>
                <p><strong>Type:</strong> {selectedMission.type}</p>
                {selectedMission.assignedFleetId && (
                  <p className="text-amber-600 mb-4">
                    Currently assigned to: {selectedMission.assignedFleetId}
                  </p>
                )}
                
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Select
                      value={selectedFleetId}
                      onValueChange={setSelectedFleetId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a fleet" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFleets.map((fleet: any) => (
                          <SelectItem key={fleet.fleetId} value={fleet.fleetId}>
                            {fleet.type} - {fleet.fleetId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
                disabled={assignFleetMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAssignFleet}
                disabled={assignFleetMutation.isPending || !selectedFleetId}
              >
                {assignFleetMutation.isPending ? "Assigning..." : "Assign Fleet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
}