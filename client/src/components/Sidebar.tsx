import { Link, useLocation } from "wouter";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/", icon: "dashboard" },
    { name: "Solar System", path: "/solar-system", icon: "public" },
    { name: "Celestial Management", path: "/celestial-management", icon: "stars" },
    { name: "Players", path: "/players", icon: "person" },
    { name: "NPCs", path: "/npcs", icon: "smart_toy" },
    { name: "Ship Editor", path: "/ship-editor", icon: "precision_manufacturing" },
    { name: "Simple Ship Editor", path: "/simple-ship-editor", icon: "rocket_launch" },
    { name: "Missions", path: "/missions", icon: "assignment" },
    { name: "Client Simulator", path: "/client-simulator", icon: "gamepad" },
    { name: "State Replication", path: "/state-replication", icon: "sync" },
    { name: "Sanity Checks", path: "/sanity-checks", icon: "verified" },
    { name: "Performance", path: "/performance", icon: "speed" },
    { name: "Logs", path: "/logs", icon: "article" },
    { name: "Server Settings", path: "/settings", icon: "settings" },
    { name: "API Config", path: "/api-config", icon: "api" },
    { name: "API Documentation", path: "/api-docs", icon: "description" },
  ];
  
  return (
    <aside className="w-56 bg-background-dark border-r border-gray-800 flex-shrink-0 hidden md:block overflow-y-auto">
      <nav className="p-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div 
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-md text-sm cursor-pointer
                  ${location === item.path 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'}
                `}
              >
                <span className="material-icons text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}