import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { 
  Ship, 
  Settings, 
  Clipboard, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Box, 
  Zap
} from "lucide-react";

// Define a type for ship templates
interface ShipTemplate {
  id?: string;
  name: string;
  type: "enemy" | "transport" | "civilian" | "mining";
  description?: string;
  mass: number;
  maxSpeed: number;
  maxAcceleration: number;
  turnRate: number;
  detectionRange: number;
  signatureRadius: number;
  attackRange: number;
  fleeThreshold: number;
  waypointArrivalDistance: number;
  obstacleAvoidanceDistance: number;
  formationKeepingTolerance: number;
  pathfindingUpdateInterval: number;
}

export default function ShipEditor() {
  const [templates, setTemplates] = useState<ShipTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // Current template being edited
  const [currentTemplate, setCurrentTemplate] = useState<ShipTemplate>({
    name: "",
    type: "enemy",
    description: "",
    mass: 1000,
    maxSpeed: 50,
    maxAcceleration: 10,
    turnRate: 0.1,
    detectionRange: 1000,
    signatureRadius: 100,
    attackRange: 500,
    fleeThreshold: 0.3,
    waypointArrivalDistance: 100,
    obstacleAvoidanceDistance: 200,
    formationKeepingTolerance: 50,
    pathfindingUpdateInterval: 5000
  });
  
  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  // Function to fetch templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ship-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to save template
  const saveTemplate = async () => {
    console.log("saveTemplate called, currentTemplate:", currentTemplate);
    
    try {
      const url = editMode && currentTemplate.id 
        ? `/api/ship-templates/${currentTemplate.id}`
        : '/api/ship-templates';
        
      const method = editMode ? 'PUT' : 'POST';
      
      console.log("Making request to:", url, "with method:", method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentTemplate),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      const data = await response.json();
      console.log("Save successful, response data:", data);
      
      await fetchTemplates();
      setDialogOpen(false);
      
      // Reset current template
      setCurrentTemplate({
        name: "",
        type: "enemy",
        description: "",
        mass: 1000,
        maxSpeed: 50,
        maxAcceleration: 10,
        turnRate: 0.1,
        detectionRange: 1000,
        signatureRadius: 100,
        attackRange: 500,
        fleeThreshold: 0.3,
        waypointArrivalDistance: 100,
        obstacleAvoidanceDistance: 200,
        formationKeepingTolerance: 50,
        pathfindingUpdateInterval: 5000
      });
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template: " + error);
    }
  };
  
  // Function to delete template
  const deleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      const response = await fetch(`/api/ship-templates/${templateToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      await fetchTemplates();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };
  
  // Handler for creating a new template
  const handleNewTemplate = (type: "enemy" | "transport" | "civilian" | "mining") => {
    setEditMode(false);
    
    // Set default values based on ship type
    const template: ShipTemplate = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Ship`,
      type,
      description: `A standard ${type} ship template`,
      mass: type === 'transport' ? 2000 : (type === 'mining' ? 1500 : 1000),
      maxSpeed: type === 'enemy' ? 70 : (type === 'transport' ? 40 : (type === 'mining' ? 30 : 50)),
      maxAcceleration: type === 'enemy' ? 15 : (type === 'mining' ? 8 : 10),
      turnRate: type === 'enemy' ? 0.15 : (type === 'mining' ? 0.05 : 0.1),
      detectionRange: type === 'enemy' ? 1500 : 1000,
      signatureRadius: type === 'transport' ? 150 : (type === 'mining' ? 130 : 100),
      attackRange: type === 'enemy' ? 600 : 200,
      fleeThreshold: type === 'civilian' ? 0.7 : (type === 'enemy' ? 0.3 : 0.5),
      waypointArrivalDistance: 100,
      obstacleAvoidanceDistance: 200,
      formationKeepingTolerance: 50,
      pathfindingUpdateInterval: 5000
    };
    
    setCurrentTemplate(template);
    setDialogOpen(true);
  };
  
  // Handler for editing a template
  const handleEditTemplate = (template: ShipTemplate) => {
    setEditMode(true);
    setCurrentTemplate(template);
    setDialogOpen(true);
  };
  
  // Handler for duplicating a template
  const handleDuplicateTemplate = (template: ShipTemplate) => {
    setEditMode(false);
    const { id, ...rest } = template;
    setCurrentTemplate({
      ...rest,
      name: `${template.name} (Copy)`,
    });
    setDialogOpen(true);
  };
  
  // Function to get ship type badge color
  const getShipTypeBadgeColor = (type: string): string => {
    switch(type) {
      case 'enemy':
        return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300';
      case 'transport':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300';
      case 'civilian':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300';
      case 'mining':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert number values
    if (
      name === 'mass' || 
      name === 'maxSpeed' || 
      name === 'maxAcceleration' || 
      name === 'turnRate' || 
      name === 'detectionRange' || 
      name === 'signatureRadius' || 
      name === 'attackRange' || 
      name === 'fleeThreshold' || 
      name === 'waypointArrivalDistance' || 
      name === 'obstacleAvoidanceDistance' || 
      name === 'formationKeepingTolerance' || 
      name === 'pathfindingUpdateInterval'
    ) {
      setCurrentTemplate(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setCurrentTemplate(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handler for select changes
  const handleSelectChange = (value: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      type: value as "enemy" | "transport" | "civilian" | "mining"
    }));
    
    // Adjust default values based on ship type
    if (value === 'enemy') {
      setCurrentTemplate(prev => ({
        ...prev,
        attackRange: 500,
        fleeThreshold: 0.3
      }));
    } else if (value === 'transport') {
      setCurrentTemplate(prev => ({
        ...prev,
        maxSpeed: 40,
        mass: 2000
      }));
    } else if (value === 'civilian') {
      setCurrentTemplate(prev => ({
        ...prev,
        fleeThreshold: 0.7,
        detectionRange: 800
      }));
    } else if (value === 'mining') {
      setCurrentTemplate(prev => ({
        ...prev,
        maxSpeed: 30,
        turnRate: 0.05
      }));
    }
  };
  
  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ship Editor</h1>
          <p className="text-muted-foreground">
            Create and manage ship templates for the space simulation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Card className="flex-1 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Ship Template
              </CardTitle>
              <CardDescription>
                Select a ship type to create a new customizable template
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Button 
                onClick={() => handleNewTemplate('enemy')} 
                variant="outline"
                className="h-24 flex flex-col border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-300 dark:border-red-900"
              >
                <Ship className="h-6 w-6 mb-2 text-red-500" />
                <span>Combat</span>
              </Button>
              <Button 
                onClick={() => handleNewTemplate('transport')} 
                variant="outline"
                className="h-24 flex flex-col border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 dark:border-blue-900"
              >
                <Box className="h-6 w-6 mb-2 text-blue-500" />
                <span>Transport</span>
              </Button>
              <Button 
                onClick={() => handleNewTemplate('civilian')} 
                variant="outline"
                className="h-24 flex flex-col border-green-200 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-300 dark:border-green-900"
              >
                <Ship className="h-6 w-6 mb-2 text-green-500" />
                <span>Civilian</span>
              </Button>
              <Button 
                onClick={() => handleNewTemplate('mining')} 
                variant="outline"
                className="h-24 flex flex-col border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950 dark:hover:text-amber-300 dark:border-amber-900"
              >
                <Zap className="h-6 w-6 mb-2 text-amber-500" />
                <span>Mining</span>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="shadow-lg opacity-50 animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 w-40 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-60 bg-muted rounded opacity-50"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 w-20 bg-muted rounded"></div>
                        <div className="h-4 w-16 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full h-9 bg-muted rounded"></div>
                </CardFooter>
              </Card>
            ))
          ) : templates.length > 0 ? (
            templates.map((template: ShipTemplate) => (
              <Card key={template.id} className="shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                    <Badge className={getShipTypeBadgeColor(template.type)}>
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {template.description || `A ${template.type} ship template`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mass:</span>
                      <span className="font-mono">{template.mass} tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Speed:</span>
                      <span className="font-mono">{template.maxSpeed} m/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Turn Rate:</span>
                      <span className="font-mono">{template.turnRate} rad/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acceleration:</span>
                      <span className="font-mono">{template.maxAcceleration} m/s²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Detection Range:</span>
                      <span className="font-mono">{template.detectionRange} m</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTemplateToDelete(template.id!);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                    Delete
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Clipboard className="h-4 w-4 mr-1" />
                      Clone
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center p-12 text-center">
              <div>
                <Ship className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-medium mb-1">No Ship Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new ship template to get started
                </p>
                <Button onClick={() => handleNewTemplate('enemy')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Ship Template" : "Create New Ship Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the specifications and behavior of this ship template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Basic Information
                  </h3>
                
                  <div className="space-y-2">
                    <Label htmlFor="name">Ship Name</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={currentTemplate.name}
                      onChange={handleInputChange}
                      placeholder="Enter ship name" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Ship Type</Label>
                    <select 
                      id="type"
                      value={currentTemplate.type}
                      onChange={(e) => handleSelectChange(e.target.value)}
                      className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="enemy">Combat</option>
                      <option value="transport">Transport</option>
                      <option value="civilian">Civilian</option>
                      <option value="mining">Mining</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description"
                      name="description"
                      value={currentTemplate.description || ''}
                      onChange={handleInputChange}
                      placeholder="Ship description" 
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Performance
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="mass">Mass (tons)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.mass}
                      </span>
                    </div>
                    <Input 
                      id="mass"
                      name="mass"
                      type="number"
                      value={currentTemplate.mass}
                      onChange={handleInputChange}
                      min="10"
                      max="10000"
                      step="10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="maxSpeed">Max Speed (m/s)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.maxSpeed}
                      </span>
                    </div>
                    <Input 
                      id="maxSpeed"
                      name="maxSpeed"
                      type="number"
                      value={currentTemplate.maxSpeed}
                      onChange={handleInputChange}
                      min="10"
                      max="200"
                      step="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="turnRate">Turn Rate (rad/s)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.turnRate.toFixed(2)}
                      </span>
                    </div>
                    <Input 
                      id="turnRate"
                      name="turnRate"
                      type="number"
                      value={currentTemplate.turnRate}
                      onChange={handleInputChange}
                      min="0.01"
                      max="0.5"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Sensors & Combat
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="detectionRange">Detection Range (m)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.detectionRange}
                      </span>
                    </div>
                    <Input 
                      id="detectionRange"
                      name="detectionRange"
                      type="number"
                      value={currentTemplate.detectionRange}
                      onChange={handleInputChange}
                      min="100"
                      max="5000"
                      step="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="attackRange">Attack Range (m)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.attackRange}
                      </span>
                    </div>
                    <Input 
                      id="attackRange"
                      name="attackRange"
                      type="number"
                      value={currentTemplate.attackRange}
                      onChange={handleInputChange}
                      min="0"
                      max="1000"
                      step="50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="fleeThreshold">Flee Threshold</Label>
                      <span className="text-sm text-muted-foreground">
                        {(currentTemplate.fleeThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Input 
                      id="fleeThreshold"
                      name="fleeThreshold"
                      type="number"
                      value={currentTemplate.fleeThreshold}
                      onChange={handleInputChange}
                      min="0"
                      max="1"
                      step="0.05"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Navigation
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="waypointArrivalDistance">Waypoint Arrival (m)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.waypointArrivalDistance}
                      </span>
                    </div>
                    <Input 
                      id="waypointArrivalDistance"
                      name="waypointArrivalDistance"
                      type="number"
                      value={currentTemplate.waypointArrivalDistance}
                      onChange={handleInputChange}
                      min="10"
                      max="500"
                      step="10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="obstacleAvoidanceDistance">Obstacle Avoidance (m)</Label>
                      <span className="text-sm text-muted-foreground">
                        {currentTemplate.obstacleAvoidanceDistance}
                      </span>
                    </div>
                    <Input 
                      id="obstacleAvoidanceDistance"
                      name="obstacleAvoidanceDistance"
                      type="number"
                      value={currentTemplate.obstacleAvoidanceDistance}
                      onChange={handleInputChange}
                      min="50"
                      max="500"
                      step="10"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                console.log("Cancel button clicked");
                setDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("Create/Save button clicked");
                  saveTemplate();
                }}
              >
                {editMode ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ship template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTemplate}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}