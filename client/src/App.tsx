import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SolarSystem from "@/pages/SolarSystem";
import CelestialManagement from "@/pages/CelestialManagement";
import Players from "@/pages/Players";
import Npcs from "@/pages/Npcs";
import ShipEditor from "@/pages/ShipEditor";
import SimpleShipEditor from "@/pages/SimpleShipEditor";
import Missions from "@/pages/Missions";
import Performance from "@/pages/Performance";
import StateReplication from "@/pages/StateReplication";
import SanityChecks from "@/pages/SanityChecks";
import Logs from "@/pages/Logs";
import ServerSettings from "@/pages/ServerSettings";
import ApiConfig from "@/pages/ApiConfig";
import ApiDocs from "@/pages/ApiDocs";
import ClientSimulator from "@/pages/ClientSimulator";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ServerProvider } from "@/contexts/ServerContext";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/solar-system" component={SolarSystem} />
            <Route path="/celestial-management" component={CelestialManagement} />
            <Route path="/players" component={Players} />
            <Route path="/npcs" component={Npcs} />
            <Route path="/ship-editor" component={ShipEditor} />
            <Route path="/simple-ship-editor" component={SimpleShipEditor} />
            <Route path="/missions" component={Missions} />
            <Route path="/performance" component={Performance} />
            <Route path="/state-replication" component={StateReplication} />
            <Route path="/sanity-checks" component={SanityChecks} />
            <Route path="/logs" component={Logs} />
            <Route path="/settings" component={ServerSettings} />
            <Route path="/api-config" component={ApiConfig} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route path="/client-simulator" component={ClientSimulator} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServerProvider>
        <Router />
      </ServerProvider>
    </QueryClientProvider>
  );
}

export default App;
