import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServerLog {
  id: number;
  timestamp: number;
  level: string;
  message: string;
  source?: string;
  data?: any;
}

export default function Logs() {
  const [logLevel, setLogLevel] = useState("all");
  const [limit, setLimit] = useState("100");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/logs', { level: logLevel, limit: parseInt(limit, 10) }],
    queryFn: () => {
      let url = `/api/logs?limit=${limit}`;
      if (logLevel !== "all") {
        url += `&level=${logLevel}`;
      }
      return fetch(url).then(res => res.json());
    },
    refetchInterval: logLevel === "all" || logLevel === "error" ? 5000 : 10000,
  });

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-error';
      case 'warn': return 'text-warning';
      case 'info': return 'text-info';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const logs = data?.success ? (data.data as ServerLog[]) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Server Logs</h1>
        <p className="text-gray-400">Monitoring and troubleshooting system events</p>
      </div>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg mb-6">
        <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row justify-between items-center">
          <CardTitle className="text-base font-medium">System Logs</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-40 h-8">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="error">Errors Only</SelectItem>
                <SelectItem value="warn">Warnings & Errors</SelectItem>
                <SelectItem value="info">Info & Above</SelectItem>
                <SelectItem value="debug">Debug & Above</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="bg-background text-sm rounded border border-gray-700 w-32 h-8">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="1000">Last 1000</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <span className="material-icons text-sm mr-1">refresh</span>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 font-mono text-sm h-[600px] overflow-y-auto bg-background-dark">
            {isLoading ? (
              <div className="text-center py-8">Loading logs...</div>
            ) : logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className={`${getLogLevelColor(log.level)}`}>
                    <span className="text-gray-500">[{formatTimestamp(log.timestamp)}] [{log.level.toUpperCase()}] </span>
                    {log.message}
                    {log.source && (
                      <span className="text-gray-500"> (Source: {log.source})</span>
                    )}
                    {log.data && (
                      <div className="text-xs text-gray-400 ml-6 mt-1">
                        {JSON.stringify(log.data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">No logs found</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-background-dark border-gray-800 shadow-lg">
        <CardHeader className="border-b border-gray-800 py-3 px-4">
          <CardTitle className="text-base font-medium">Log Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-background-light rounded-lg border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Total Logs</div>
              <div className="text-2xl font-mono">{logs.length}</div>
            </div>
            
            <div className="p-3 bg-background-light rounded-lg border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Errors</div>
              <div className="text-2xl font-mono text-error">
                {logs.filter(log => log.level.toLowerCase() === 'error').length}
              </div>
            </div>
            
            <div className="p-3 bg-background-light rounded-lg border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Warnings</div>
              <div className="text-2xl font-mono text-warning">
                {logs.filter(log => log.level.toLowerCase() === 'warn').length}
              </div>
            </div>
            
            <div className="p-3 bg-background-light rounded-lg border border-gray-800">
              <div className="text-xs text-gray-400 mb-1">Info</div>
              <div className="text-2xl font-mono text-info">
                {logs.filter(log => log.level.toLowerCase() === 'info').length}
              </div>
            </div>
          </div>
          
          {/* Log sources summary */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Log Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(logs.map(log => log.source || 'unknown'))).map(source => (
                <div key={source} className="flex justify-between p-2 bg-background rounded-lg border border-gray-800">
                  <div className="text-sm">{source}</div>
                  <div className="text-sm font-mono">
                    {logs.filter(log => (log.source || 'unknown') === source).length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
