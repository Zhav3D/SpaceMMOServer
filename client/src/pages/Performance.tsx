import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import StatsCard from "@/components/StatsCard";

export default function Performance() {
  const [timeRange, setTimeRange] = useState("5m");
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    // Set the appropriate limit based on time range
    switch (timeRange) {
      case "5m": setLimit(30); break;
      case "15m": setLimit(90); break;
      case "1h": setLimit(360); break;
      case "6h": setLimit(1000); break;
      default: setLimit(30);
    }
  }, [timeRange]);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/stats', { limit }],
    queryFn: () => fetch(`/api/stats?limit=${limit}`).then(res => res.json()),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: serverStatus } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 10000,
  });

  const formatData = (stats: any[]) => {
    if (!stats || !stats.length) return [];
    
    return [...stats].reverse().map(stat => ({
      time: new Date(stat.timestamp * 1000).toLocaleTimeString(),
      cpu: stat.cpuLoad,
      memory: stat.memoryUsage,
      network: stat.networkTraffic,
      players: stat.playerCount,
      timestamp: stat.timestamp,
    }));
  };

  const getLatestStat = (stats: any[]) => {
    if (!stats || !stats.length) return null;
    return stats[0];
  };

  const stats = statsData?.success ? statsData.data : [];
  const chartData = formatData(stats);
  const latestStat = getLatestStat(stats);
  const uptime = serverStatus?.success ? serverStatus.data.uptime : 0;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Performance Monitoring</h1>
        <p className="text-gray-400">Server performance metrics and resource utilization</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Current CPU Load"
          value={latestStat ? `${latestStat.cpuLoad.toFixed(1)}%` : "--.--%"}
          icon="memory"
          iconColor="info"
          percentage={latestStat ? latestStat.cpuLoad : 0}
          footer="4 cores | 3.6 GHz"
          isLoading={isLoading}
        />
        
        <StatsCard 
          title="Memory Usage"
          value={latestStat ? `${latestStat.memoryUsage.toFixed(1)} MB` : "-.-- MB"}
          icon="storage"
          iconColor="warning"
          percentage={latestStat ? (latestStat.memoryUsage / 8000) * 100 : 0}
          footer={`8 GB total | ${latestStat ? ((latestStat.memoryUsage / 8000) * 100).toFixed(1) : "--.-"}% used`}
          isLoading={isLoading}
        />
        
        <StatsCard 
          title="Network Traffic"
          value={latestStat ? `${latestStat.networkTraffic.toFixed(1)} MB/s` : "-.-- MB/s"}
          icon="sync"
          iconColor="success"
          percentage={latestStat ? (latestStat.networkTraffic / 1000) * 100 : 0}
          footer={`1 Gbps capacity | ${latestStat ? ((latestStat.networkTraffic / 1000) * 100).toFixed(1) : "--.-"}% utilized`}
          isLoading={isLoading}
        />
        
        <StatsCard 
          title="Server Uptime"
          value={formatUptime(uptime)}
          icon="timer"
          iconColor="secondary"
          percentage={Math.min((uptime / (30 * 24 * 3600)) * 100, 100)} // % of 30 days
          footer={`Started: ${uptime ? new Date(Date.now() - uptime * 1000).toLocaleString() : "Unknown"}`}
          isLoading={isLoading}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
            <CardTitle className="text-base font-medium">Performance Metrics Over Time</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-32 h-8">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">Last 5 minutes</SelectItem>
                <SelectItem value="15m">Last 15 minutes</SelectItem>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="6h">Last 6 hours</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  Loading performance data...
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(30,30,30,0.9)', 
                        borderColor: 'rgba(120,120,120,0.3)',
                        color: 'white'
                      }}
                      labelStyle={{ color: 'white' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      name="CPU Load (%)" 
                      stroke="hsl(var(--info))" 
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      name="Memory (MB)" 
                      stroke="hsl(var(--warning))" 
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network" 
                      name="Network (MB/s)" 
                      stroke="hsl(var(--success))" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  No performance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-dark border-gray-800 shadow-lg">
          <CardHeader className="border-b border-gray-800 py-3 px-4">
            <CardTitle className="text-base font-medium">Player Count History</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-60">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  Loading player data...
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(30,30,30,0.9)', 
                        borderColor: 'rgba(120,120,120,0.3)',
                        color: 'white'
                      }}
                      labelStyle={{ color: 'white' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="players" 
                      name="Player Count" 
                      stroke="hsl(var(--secondary))" 
                      dot={false}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  No player data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
