import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ApiConfig() {
  const { toast } = useToast();
  
  // API Keys state
  const [unityApiKey, setUnityApiKey] = useState("");
  const [webApiKey, setWebApiKey] = useState("");
  const [thirdPartyApiKey, setThirdPartyApiKey] = useState("");
  
  // Rate limiting state
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [requestsPerMinute, setRequestsPerMinute] = useState("60");
  const [burstLimit, setBurstLimit] = useState("10");
  
  // CORS state
  const [corsEnabled, setCorsEnabled] = useState(true);
  const [allowedOrigins, setAllowedOrigins] = useState("*");
  
  // Endpoint permissions state
  const [readonly, setReadonly] = useState(false);
  const [authRequired, setAuthRequired] = useState(true);
  const [loggingLevel, setLoggingLevel] = useState("info");
  
  const handleSaveApiSettings = () => {
    // In a real app, this would save the settings to the server
    console.log("Saving API Settings", {
      unityApiKey,
      webApiKey,
      thirdPartyApiKey,
      rateLimitEnabled,
      requestsPerMinute,
      burstLimit,
      corsEnabled,
      allowedOrigins,
      readonly,
      authRequired,
      loggingLevel,
    });
    
    toast({
      title: "Settings Saved",
      description: "API configuration has been updated.",
    });
  };
  
  const handleResetApiKeys = () => {
    // In a real app, this would reset API keys on the server
    setUnityApiKey(generateApiKey());
    setWebApiKey(generateApiKey());
    setThirdPartyApiKey(generateApiKey());
    
    toast({
      title: "API Keys Reset",
      description: "New API keys have been generated. Make sure to update your clients.",
      variant: "warning",
    });
  };
  
  const generateApiKey = () => {
    return `key_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">API Configuration</h1>
        <p className="text-gray-400">Manage access, security and rate limiting for API endpoints</p>
      </div>
      
      <Tabs defaultValue="keys" className="mb-6">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="ratelimiting">Rate Limiting</TabsTrigger>
          <TabsTrigger value="cors">CORS Settings</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="keys">
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Authentication Keys</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unity-api-key">Unity Client API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="unity-api-key"
                    className="bg-background border-gray-700 font-mono"
                    value={unityApiKey || "No key generated yet"}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setUnityApiKey(generateApiKey())}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Used for Unity game clients to authenticate</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web-api-key">Web Dashboard API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="web-api-key"
                    className="bg-background border-gray-700 font-mono"
                    value={webApiKey || "No key generated yet"}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setWebApiKey(generateApiKey())}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Used for web dashboard access</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="third-party-api-key">Third-Party API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="third-party-api-key"
                    className="bg-background border-gray-700 font-mono"
                    value={thirdPartyApiKey || "No key generated yet"}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setThirdPartyApiKey(generateApiKey())}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-400">For third-party integrations with limited access</p>
              </div>
              
              <div className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleResetApiKeys}
                >
                  Reset All API Keys
                </Button>
                <p className="text-xs text-gray-400 mt-1 text-center">Warning: This will invalidate all existing keys</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ratelimiting">
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">Rate Limiting Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="rate-limit-enabled" className="text-base">Rate Limiting</Label>
                  <p className="text-sm text-gray-400">
                    Limit request frequency per client
                  </p>
                </div>
                <Switch 
                  id="rate-limit-enabled" 
                  checked={rateLimitEnabled}
                  onCheckedChange={setRateLimitEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requests-per-minute">Requests Per Minute</Label>
                <Input
                  id="requests-per-minute"
                  type="number"
                  className="bg-background border-gray-700"
                  value={requestsPerMinute}
                  onChange={(e) => setRequestsPerMinute(e.target.value)}
                  min="1"
                  disabled={!rateLimitEnabled}
                />
                <p className="text-xs text-gray-400">Maximum requests allowed per minute per client</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="burst-limit">Burst Limit</Label>
                <Input
                  id="burst-limit"
                  type="number"
                  className="bg-background border-gray-700"
                  value={burstLimit}
                  onChange={(e) => setBurstLimit(e.target.value)}
                  min="1"
                  disabled={!rateLimitEnabled}
                />
                <p className="text-xs text-gray-400">Maximum concurrent requests allowed</p>
              </div>
              
              <div className="pt-4">
                <div className="p-3 bg-background rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium mb-2">Endpoint-Specific Limits</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/status</span>
                      <span>120 rpm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/players</span>
                      <span>60 rpm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/celestial</span>
                      <span>30 rpm</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cors">
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">CORS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cors-enabled" className="text-base">CORS Protection</Label>
                  <p className="text-sm text-gray-400">
                    Control cross-origin resource sharing
                  </p>
                </div>
                <Switch 
                  id="cors-enabled" 
                  checked={corsEnabled}
                  onCheckedChange={setCorsEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowed-origins">Allowed Origins</Label>
                <Input
                  id="allowed-origins"
                  className="bg-background border-gray-700"
                  value={allowedOrigins}
                  onChange={(e) => setAllowedOrigins(e.target.value)}
                  disabled={!corsEnabled}
                  placeholder="*"
                />
                <p className="text-xs text-gray-400">Comma-separated list of allowed origins, or * for all</p>
              </div>
              
              <div className="pt-4">
                <div className="p-3 bg-background rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium mb-2">CORS Headers</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Access-Control-Allow-Methods</span>
                      <span>GET, POST, PUT, DELETE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Access-Control-Allow-Headers</span>
                      <span>Content-Type, Authorization</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Access-Control-Max-Age</span>
                      <span>86400</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card className="bg-background-dark border-gray-800 shadow-lg">
            <CardHeader className="border-b border-gray-800 py-3 px-4">
              <CardTitle className="text-base font-medium">API Permissions & Security</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="readonly-mode" className="text-base">Read-Only Mode</Label>
                  <p className="text-sm text-gray-400">
                    Disable all write operations
                  </p>
                </div>
                <Switch 
                  id="readonly-mode" 
                  checked={readonly}
                  onCheckedChange={setReadonly}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auth-required" className="text-base">Authentication Required</Label>
                  <p className="text-sm text-gray-400">
                    Require API key for all endpoints
                  </p>
                </div>
                <Switch 
                  id="auth-required" 
                  checked={authRequired}
                  onCheckedChange={setAuthRequired}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logging-level">API Logging Level</Label>
                <Select value={loggingLevel} onValueChange={setLoggingLevel}>
                  <SelectTrigger className="bg-background border-gray-700">
                    <SelectValue placeholder="Select logging level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error Only</SelectItem>
                    <SelectItem value="warn">Warning & Error</SelectItem>
                    <SelectItem value="info">Info & Above</SelectItem>
                    <SelectItem value="debug">Debug & Above</SelectItem>
                    <SelectItem value="trace">Trace (All)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Level of detail for API request logging</p>
              </div>
              
              <div className="pt-4">
                <div className="p-3 bg-background rounded-lg border border-gray-700">
                  <h3 className="text-sm font-medium mb-2">Endpoint Permissions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/status</span>
                      <span>Public</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/players</span>
                      <span>Authenticated</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/celestial</span>
                      <span>Authenticated</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">/api/settings</span>
                      <span>Admin Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Button 
        onClick={handleSaveApiSettings} 
        className="w-full md:w-auto bg-primary hover:bg-primary/80"
      >
        Save API Configuration
      </Button>
    </div>
  );
}