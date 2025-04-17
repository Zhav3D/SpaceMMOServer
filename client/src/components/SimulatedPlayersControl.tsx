import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SimulatedPlayersControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerCount, setPlayerCount] = useState(100);
  
  // Get current simulated player stats
  const { data: simulatedStats, isLoading } = useQuery({
    queryKey: ['/api/simulated-players'],
    refetchInterval: 5000,
  });
  
  // Mutation to create simulated players
  const createPlayersMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await fetch('/api/simulated-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create simulated players');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulated-players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      
      toast({
        title: "Players Created",
        description: `Successfully created ${playerCount} simulated players`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to remove all simulated players
  const removePlayersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/simulated-players', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove simulated players');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/simulated-players'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      
      toast({
        title: "Players Removed",
        description: "All simulated players have been removed",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setPlayerCount(value[0]);
  };
  
  // Handle create players button click
  const handleCreatePlayers = () => {
    createPlayersMutation.mutate(playerCount);
  };
  
  // Handle remove all players button click
  const handleRemovePlayers = () => {
    removePlayersMutation.mutate();
  };
  
  // Calculate server load percentage (rough estimation)
  const getServerLoad = () => {
    if (!simulatedStats?.success) return 0;
    return Math.min(100, (simulatedStats.data.totalPlayers / 2000) * 100);
  };
  
  // Get appropriate color class for load indicator
  const getLoadColorClass = () => {
    const load = getServerLoad();
    if (load < 30) return "text-emerald-500";
    if (load < 70) return "text-amber-500";
    return "text-red-500";
  };
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg">
      <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-medium">Simulated Players</CardTitle>
        <Badge 
          variant={simulatedStats?.success && simulatedStats.data.count > 0 ? "success" : "outline"}
          className="text-xs"
        >
          {simulatedStats?.success ? `${simulatedStats.data.count} active` : 'No active players'}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Server Load</span>
                <span className={getLoadColorClass()}>
                  {getServerLoad().toFixed(1)}%
                </span>
              </div>
              <Progress value={getServerLoad()} className={`h-2 ${getLoadColorClass()}`} />
              
              <div className="text-xs text-gray-500 mt-1">
                {simulatedStats?.success ? (
                  <>
                    {simulatedStats.data.count} simulated players
                    {simulatedStats.data.realPlayers > 0 && ` + ${simulatedStats.data.realPlayers} real players`}
                    {" = "}
                    {simulatedStats.data.totalPlayers} total
                  </>
                ) : 'Player statistics unavailable'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Simulated Player Count</span>
                <span className="font-medium">{playerCount}</span>
              </div>
              <Slider
                value={[playerCount]}
                onValueChange={handleSliderChange}
                min={1}
                max={1000}
                step={10}
                className="my-4"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={handleCreatePlayers}
                className="flex-1"
                disabled={createPlayersMutation.isPending}
              >
                {createPlayersMutation.isPending ? "Creating..." : "Create Players"}
              </Button>
              
              <Button 
                onClick={handleRemovePlayers}
                variant="destructive"
                className="flex-1"
                disabled={removePlayersMutation.isPending || (simulatedStats?.success && simulatedStats.data.count === 0)}
              >
                {removePlayersMutation.isPending ? "Removing..." : "Remove All"}
              </Button>
            </div>
            
            <div className="text-xs text-gray-400 mt-2">
              Create simulated players to test system load and behavior. These players will move around randomly in the game world.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}