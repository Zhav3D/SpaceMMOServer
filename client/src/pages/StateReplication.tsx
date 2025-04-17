import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface AOIData {
  id: number;
  name: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  nearestCelestialBodyId: number;
  playerCount: number;
  npcCount: number;
  updateFrequency: number;
  latency: number;
  load: number;
  capacityLimit: number;
  currentPlayerCount?: number;
  currentNpcCount?: number;
  currentLoad?: number;
  currentLatency?: number;
}

export default function StateReplication() {
  const [filterType, setFilterType] = useState("all");

  const { data: areasOfInterest, isLoading } = useQuery({
    queryKey: ['/api/aoi'],
    refetchInterval: 5000,
  });

  const filterAreas = (areas: AOIData[]) => {
    if (filterType === "all") return areas;
    if (filterType === "high_density") {
      return areas.filter(area => {
        const load = area.currentLoad !== undefined ? area.currentLoad : area.load;
        return load > 75;
      });
    }
    if (filterType === "low_performance") {
      return areas.filter(area => {
        const latency = area.currentLatency !== undefined ? area.currentLatency : area.latency;
        return latency > 150;
      });
    }
    return areas;
  };

  const getLabelColor = (value: number, threshold1: number, threshold2: number) => {
    if (value < threshold1) return "text-success";
    if (value < threshold2) return "text-warning";
    return "text-error";
  };

  const getProgressColor = (value: number, threshold1: number, threshold2: number) => {
    if (value < threshold1) return "bg-success";
    if (value < threshold2) return "bg-warning";
    return "bg-error";
  };

  const formatVector = (x: number, y: number, z: number) => {
    return `(${x.toFixed(0)}, ${y.toFixed(0)}, ${z.toFixed(0)})`;
  };

  const areas = areasOfInterest?.success ? (areasOfInterest.data as AOIData[]) : [];
  const filteredAreas = filterAreas(areas);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">State Replication</h1>
        <p className="text-gray-400">Area of Interest management and spatial partitioning</p>
      </div>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg mb-6">
        <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
          <CardTitle className="text-base font-medium">Area of Interest Management</CardTitle>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-44 h-8">
              <SelectValue placeholder="Filter areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All Areas</SelectItem>
              <SelectItem value="high_density">High Density Only</SelectItem>
              <SelectItem value="low_performance">Low Performance Only</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-center py-8">Loading areas of interest...</div>
          ) : filteredAreas.length > 0 ? (
            <div className="space-y-6">
              {filteredAreas.map((area) => {
                const playerCount = area.currentPlayerCount !== undefined ? area.currentPlayerCount : area.playerCount;
                const npcCount = area.currentNpcCount !== undefined ? area.currentNpcCount : area.npcCount;
                const load = area.currentLoad !== undefined ? area.currentLoad : area.load;
                const latency = area.currentLatency !== undefined ? area.currentLatency : area.latency;
                
                return (
                  <div key={area.id} className="bg-background-light p-4 rounded-lg border border-gray-800">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-lg">{area.name}</h3>
                      <div className="flex items-center">
                        <span className={`font-mono ${getLabelColor(latency, 100, 200)}`}>
                          {latency.toFixed(1)}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Entity Count</span>
                          <div className="font-mono">
                            <span className="text-info">{playerCount + npcCount}</span>
                            /{area.capacityLimit}
                          </div>
                        </div>
                        <Progress 
                          value={(playerCount + npcCount) / area.capacityLimit * 100} 
                          className="h-1.5 bg-gray-800"
                          indicatorClassName={getProgressColor((playerCount + npcCount) / area.capacityLimit * 100, 60, 80)}
                        />
                        <div className="mt-1 text-xs text-gray-400 flex justify-between">
                          <span>Players: {playerCount}</span>
                          <span>NPCs: {npcCount}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Server Load</span>
                          <div className="font-mono">
                            <span className={getLabelColor(load, 60, 80)}>{load.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Progress 
                          value={load} 
                          className="h-1.5 bg-gray-800"
                          indicatorClassName={getProgressColor(load, 60, 80)}
                        />
                        <div className="mt-1 text-xs text-gray-400 flex justify-between">
                          <span>Update frequency: {area.updateFrequency}Hz</span>
                          <span>Latency: {latency.toFixed(1)}ms</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                      <div>Center: <span className="text-white font-mono">{formatVector(area.centerX, area.centerY, area.centerZ)}</span></div>
                      <div>Radius: <span className="text-white font-mono">{area.radius.toLocaleString()} units</span></div>
                      <div>Celestial ID: <span className="text-white font-mono">{area.nearestCelestialBodyId}</span></div>
                      <div>Area ID: <span className="text-white font-mono">{area.id}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              {filterType !== "all" ? 
                "No areas match the current filter" : 
                "No areas of interest found"
              }
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg">
        <CardHeader className="border-b border-gray-800 py-3 px-4">
          <CardTitle className="text-base font-medium">State Replication Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-6">
            <div className="bg-background-light p-4 rounded-lg border border-gray-800">
              <h3 className="font-medium mb-2">How Area of Interest Works</h3>
              <p className="text-sm text-gray-300 mb-4">
                The server uses spatial partitioning to efficiently replicate game state. 
                Each player receives updates only for entities within their area of interest, 
                reducing bandwidth and processing requirements.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-secondary mb-2">Entity Filtering</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Players receive updates only for nearby entities</li>
                    <li>Update frequency varies based on area load</li>
                    <li>High-priority events are always delivered</li>
                    <li>Distant entities are updated less frequently</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary mb-2">Performance Optimization</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Binary serialization for efficient packet size</li>
                    <li>Dynamic update frequencies based on area load</li>
                    <li>Prioritized replication for important entities</li>
                    <li>Automatic load balancing between areas</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-background-light p-4 rounded-lg border border-gray-800">
              <h3 className="font-medium mb-2">Replication Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-background-dark rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Total Areas</div>
                  <div className="text-2xl font-mono">{areas.length}</div>
                </div>
                
                <div className="p-3 bg-background-dark rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Average Load</div>
                  <div className="text-2xl font-mono">
                    {areas.length > 0 
                      ? (areas.reduce((sum, area) => sum + (area.currentLoad !== undefined ? area.currentLoad : area.load), 0) / areas.length).toFixed(1) + '%'
                      : '0.0%'
                    }
                  </div>
                </div>
                
                <div className="p-3 bg-background-dark rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Average Latency</div>
                  <div className="text-2xl font-mono">
                    {areas.length > 0 
                      ? (areas.reduce((sum, area) => sum + (area.currentLatency !== undefined ? area.currentLatency : area.latency), 0) / areas.length).toFixed(1) + 'ms'
                      : '0.0ms'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
