import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ServerLog {
  id: number;
  timestamp: number;
  level: string;
  message: string;
  source?: string;
  data?: any;
}

interface ServerDiagnosticsProps {
  logs: ServerLog[];
  isLoading?: boolean;
}

export default function ServerDiagnostics({
  logs,
  isLoading = false,
}: ServerDiagnosticsProps) {
  // Format timestamp to readable format
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Get badge class based on log level
  const getLogLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warn': return 'warning';
      case 'info': return 'secondary';
      case 'debug': return 'outline';
      default: return 'outline';
    }
  };
  
  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg">
      <CardHeader className="border-b border-gray-800 py-3 px-4">
        <CardTitle className="text-base font-medium">Recent Issues</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getLogLevelBadge(log.level)} className="uppercase text-xs">
                        {log.level}
                      </Badge>
                      {log.source && (
                        <span className="text-sm text-gray-400">{log.source}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  
                  <div className="mt-1 text-sm">{log.message}</div>
                  
                  {log.data && (
                    <div className="mt-2 p-2 bg-background rounded text-xs font-mono text-gray-400 overflow-auto">
                      {typeof log.data === 'object' 
                        ? JSON.stringify(log.data, null, 2)
                        : log.data.toString()
                      }
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <div className="text-gray-400">No issues detected</div>
                <div className="text-xs text-gray-500 mt-1">Server is running normally</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}