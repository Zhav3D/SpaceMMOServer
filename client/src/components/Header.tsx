import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useServerContext } from "@/contexts/ServerContext";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { serverStatus } = useServerContext();
  
  return (
    <header className="border-b border-gray-800 bg-background-dark py-3 px-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/">
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text cursor-pointer">
            SpaceMMO Server
          </div>
        </Link>
        
        {serverStatus?.success && (
          <Badge 
            variant={serverStatus.data.status === 'online' ? 'success' : 'destructive'}
            className="ml-4"
          >
            {serverStatus.data.status === 'online' ? 'Online' : 'Offline'}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {serverStatus?.success && (
          <div className="text-sm text-gray-400">
            <span className="font-medium text-white">{serverStatus.data.playerCount}</span> players online
          </div>
        )}
        
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <span>Server Settings</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}