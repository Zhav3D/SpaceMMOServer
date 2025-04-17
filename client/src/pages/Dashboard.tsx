import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/StatsCard";
import SolarSystemVisualization from "@/components/SolarSystemVisualization";
import PlanetaryStatus from "@/components/PlanetaryStatus";
import AreaOfInterestMonitor from "@/components/AreaOfInterestMonitor";
import NpcFleetStatus from "@/components/NpcFleetStatus";
import ServerDiagnostics from "@/components/ServerDiagnostics";
import SimulatedPlayersControl from "@/components/SimulatedPlayersControl";
import { useToast } from "@/hooks/use-toast";
import { useServerContext } from "@/contexts/ServerContext";

export default function Dashboard() {
  const { toast } = useToast();
  const { serverStatus, refreshServerStatus } = useServerContext();

  const { data: celestialBodies, isLoading: loadingBodies } = useQuery({
    queryKey: ['/api/celestial'],
    staleTime: 10000,
  });

  const { data: fleets, isLoading: loadingFleets } = useQuery({
    queryKey: ['/api/npc/fleets'],
    staleTime: 10000,
  });

  const { data: areasOfInterest, isLoading: loadingAOI } = useQuery({
    queryKey: ['/api/aoi'],
    staleTime: 10000,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['/api/logs', { level: 'warnings_errors', limit: 10 }],
    queryFn: () => fetch('/api/logs?limit=10&level=warnings_errors').then(res => res.json()),
    staleTime: 5000,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/stats', { limit: 1 }],
    queryFn: () => fetch('/api/stats?limit=1').then(res => res.json()),
    staleTime: 5000,
  });

  useEffect(() => {
    // Refresh server status initially
    refreshServerStatus();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      refreshServerStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshServerStatus]);

  useEffect(() => {
    if (serverStatus && serverStatus.data && serverStatus.data.status !== 'online') {
      toast({
        title: "Server Status",
        description: `Server is ${serverStatus.data.status}`,
        variant: "destructive",
      });
    }
  }, [serverStatus, toast]);

  const currentStats = stats && stats.success && stats.data && stats.data[0] ? stats.data[0] : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Server Dashboard</h1>
        <p className="text-gray-400">Real-time monitoring and control for SpaceMMO server</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="CPU Load"
          value={currentStats ? `${currentStats.cpuLoad.toFixed(1)}%` : "--.--%"}
          icon="memory"
          iconColor="info"
          percentage={currentStats ? currentStats.cpuLoad : 0}
          footer="4 cores | 3.6 GHz"
          isLoading={loadingStats}
        />
        
        <StatsCard 
          title="Memory Usage"
          value={currentStats ? `${currentStats.memoryUsage.toFixed(1)} MB` : "-.-- MB"}
          icon="storage"
          iconColor="warning"
          percentage={currentStats ? (currentStats.memoryUsage / 8000) * 100 : 0}
          footer={`8 GB total | ${currentStats ? ((currentStats.memoryUsage / 8000) * 100).toFixed(1) : "--.-"}% used`}
          isLoading={loadingStats}
        />
        
        <StatsCard 
          title="Network Traffic"
          value={currentStats ? `${currentStats.networkTraffic.toFixed(1)} MB/s` : "-.-- MB/s"}
          icon="sync"
          iconColor="success"
          percentage={currentStats ? (currentStats.networkTraffic / 1000) * 100 : 0}
          footer={`1 Gbps capacity | ${currentStats ? ((currentStats.networkTraffic / 1000) * 100).toFixed(1) : "--.-"}% utilized`}
          isLoading={loadingStats}
        />
        
        <StatsCard 
          title="Player Count"
          value={currentStats ? currentStats.playerCount.toLocaleString() : "--"}
          icon="people"
          iconColor="secondary"
          percentage={currentStats ? (currentStats.playerCount / 2000) * 100 : 0}
          footer={`2,000 capacity | ${currentStats ? ((currentStats.playerCount / 2000) * 100).toFixed(1) : "--.-"}% full`}
          isLoading={loadingStats}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SolarSystemVisualization 
            celestialBodies={celestialBodies?.success ? celestialBodies.data : []} 
            isLoading={loadingBodies}
          />
        </div>
        
        <PlanetaryStatus 
          celestialBodies={celestialBodies?.success ? celestialBodies.data : []} 
          isLoading={loadingBodies}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AreaOfInterestMonitor 
          areasOfInterest={areasOfInterest?.success ? areasOfInterest.data : []} 
          isLoading={loadingAOI}
        />
        
        <NpcFleetStatus 
          fleets={fleets?.success ? fleets.data : []} 
          isLoading={loadingFleets}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ServerDiagnostics 
            logs={logs?.success ? logs.data : []} 
            isLoading={loadingLogs}
          />
        </div>
        
        <SimulatedPlayersControl />
      </div>
    </div>
  );
}
