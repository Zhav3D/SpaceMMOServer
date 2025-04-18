import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  Ship, 
  Radar, 
  Zap, 
  Shield, 
  CornerDownRight, 
  Box, 
  PlusCircle, 
  Trash2, 
  Save, 
  RotateCw, 
  Clipboard, 
  ChevronRight,
  Info,
  FileCode2
} from "lucide-react";

// Ship template schema - this defines the structure of ship templates
const ShipTemplateSchema = z.object({
  id: z.string().optional(), // UUID will be generated if not provided
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["enemy", "transport", "civilian", "mining"]),
  description: z.string().optional(),
  
  // Performance characteristics
  mass: z.number().min(10, "Mass must be at least 10 tons").max(100000, "Mass cannot exceed 100,000 tons"),
  maxSpeed: z.number().min(10, "Speed must be at least 10 m/s").max(1000, "Speed cannot exceed 1,000 m/s"),
  maxAcceleration: z.number().min(1, "Acceleration must be at least 1 m/s²").max(100, "Acceleration cannot exceed 100 m/s²"),
  turnRate: z.number().min(0.01, "Turn rate must be at least 0.01 rad/s").max(1, "Turn rate cannot exceed 1 rad/s"),
  
  // Sensors and detection
  detectionRange: z.number().min(100, "Detection range must be at least 100m").max(10000, "Detection range cannot exceed 10,000m"),
  signatureRadius: z.number().min(10, "Signature radius must be at least 10m").max(1000, "Signature radius cannot exceed 1,000m"),
  
  // Combat characteristics
  attackRange: z.number().min(0, "Attack range cannot be negative").max(5000, "Attack range cannot exceed 5,000m"),
  fleeThreshold: z.number().min(0, "Flee threshold must be at least 0").max(1, "Flee threshold cannot exceed 1"),
  
  // Navigation characteristics
  waypointArrivalDistance: z.number().min(10, "Waypoint arrival distance must be at least 10m").max(1000, "Waypoint arrival distance cannot exceed 1,000m"),
  pathfindingUpdateInterval: z.number().min(1000, "Pathfinding interval must be at least 1,000ms").max(30000, "Pathfinding interval cannot exceed 30,000ms"),
  obstacleAvoidanceDistance: z.number().min(50, "Obstacle avoidance distance must be at least 50m").max(1000, "Obstacle avoidance distance cannot exceed 1,000m"),
  formationKeepingTolerance: z.number().min(10, "Formation keeping tolerance must be at least 10m").max(500, "Formation keeping tolerance cannot exceed 500m"),
});

type ShipTemplate = z.infer<typeof ShipTemplateSchema>;

// Default templates for different ship types
const defaultShipTemplates: Record<string, ShipTemplate> = {
  enemy: {
    name: "New Combat Ship",
    type: "enemy",
    description: "A standard combat vessel designed for engaging hostile targets",
    mass: 2500,
    maxSpeed: 50.0,
    turnRate: 0.1,
    maxAcceleration: 10.0,
    detectionRange: 1000.0,
    signatureRadius: 100,
    attackRange: 300.0,
    fleeThreshold: 0.3,
    waypointArrivalDistance: 100.0,
    pathfindingUpdateInterval: 5000,
    obstacleAvoidanceDistance: 200.0,
    formationKeepingTolerance: 50.0,
  },
  transport: {
    name: "New Transport Ship",
    type: "transport",
    description: "A cargo vessel designed for trade and transportation",
    mass: 5000,
    maxSpeed: 30.0,
    turnRate: 0.05,
    maxAcceleration: 5.0,
    detectionRange: 800.0,
    signatureRadius: 200,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.5,
    waypointArrivalDistance: 150.0,
    pathfindingUpdateInterval: 7000,
    obstacleAvoidanceDistance: 300.0,
    formationKeepingTolerance: 100.0,
  },
  civilian: {
    name: "New Civilian Ship",
    type: "civilian",
    description: "A standard civilian vessel for transport and basic operations",
    mass: 1500,
    maxSpeed: 40.0,
    turnRate: 0.08,
    maxAcceleration: 7.0,
    detectionRange: 600.0,
    signatureRadius: 80,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.7,
    waypointArrivalDistance: 120.0,
    pathfindingUpdateInterval: 6000,
    obstacleAvoidanceDistance: 250.0,
    formationKeepingTolerance: 75.0,
  },
  mining: {
    name: "New Mining Ship",
    type: "mining",
    description: "A specialized vessel designed for resource extraction",
    mass: 3000,
    maxSpeed: 20.0,
    turnRate: 0.04,
    maxAcceleration: 4.0,
    detectionRange: 700.0,
    signatureRadius: 150,
    attackRange: 0.0, // Non-combat
    fleeThreshold: 0.8,
    waypointArrivalDistance: 80.0,
    pathfindingUpdateInterval: 10000,
    obstacleAvoidanceDistance: 350.0,
    formationKeepingTolerance: 60.0,
  }
};

export default function ShipEditor() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShipTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Fetch ship templates
  const { data: templatesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/ship-templates'],
    // We now use the actual API endpoint
    staleTime: 30000,
  });
  
  // Create form for ship template editing
  const form = useForm<ShipTemplate>({
    resolver: zodResolver(ShipTemplateSchema),
    defaultValues: defaultShipTemplates.enemy,
  });
  
  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: ShipTemplate) => {
      const templateId = template.id ? parseInt(String(template.id), 10) : undefined;
      
      // Check if we're creating a new template or updating an existing one
      if (templateId && !isNaN(templateId)) {
        // Update existing template
        return apiRequest(`/api/ship-templates/${templateId}`, {
          method: 'PUT',
          data: template
        });
      } else {
        // Create new template
        return apiRequest('/api/ship-templates', {
          method: 'POST',
          data: template
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ship-templates'] });
      setDialogOpen(false);
      toast({
        title: "Template Saved",
        description: "Ship template has been successfully saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save ship template: " + String(error),
        variant: "destructive",
      });
    }
  });
  
  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const id = parseInt(templateId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid template ID");
      }
      
      return apiRequest(`/api/ship-templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ship-templates'] });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      toast({
        title: "Template Deleted",
        description: "Ship template has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete ship template: " + String(error),
        variant: "destructive",
      });
    }
  });
  
  // Handle creating a new template
  const handleNewTemplate = (type: string) => {
    setSelectedTemplate(defaultShipTemplates[type as keyof typeof defaultShipTemplates]);
    form.reset(defaultShipTemplates[type as keyof typeof defaultShipTemplates]);
    setEditMode(false);
    setDialogOpen(true);
  };
  
  // Handle editing an existing template
  const handleEditTemplate = (template: ShipTemplate) => {
    setSelectedTemplate(template);
    form.reset(template);
    setEditMode(true);
    setDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteTemplateMutation.mutate(templateToDelete);
    }
  };
  
  // Save template form submission
  const onSubmit = (data: ShipTemplate) => {
    // If in edit mode, preserve the ID
    if (editMode && selectedTemplate?.id) {
      data.id = selectedTemplate.id;
    }
    saveTemplateMutation.mutate(data);
  };
  
  // Duplicate a template
  const handleDuplicateTemplate = (template: ShipTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: undefined, // Remove ID to create a new one
      name: `${template.name} (Copy)`
    };
    setSelectedTemplate(duplicatedTemplate);
    form.reset(duplicatedTemplate);
    setEditMode(false);
    setDialogOpen(true);
  };
  
  // Handle ship type change in form
  const handleShipTypeChange = (value: string) => {
    const currentValues = form.getValues();
    form.setValue("type", value as any);
    
    // If it's a new template, load default values for the selected type
    if (!editMode) {
      const defaultTemplate = defaultShipTemplates[value as keyof typeof defaultShipTemplates];
      
      // Keep the current name and description, but update the type-specific parameters
      form.setValue("mass", defaultTemplate.mass);
      form.setValue("maxSpeed", defaultTemplate.maxSpeed);
      form.setValue("turnRate", defaultTemplate.turnRate);
      form.setValue("maxAcceleration", defaultTemplate.maxAcceleration);
      form.setValue("detectionRange", defaultTemplate.detectionRange);
      form.setValue("signatureRadius", defaultTemplate.signatureRadius);
      form.setValue("attackRange", defaultTemplate.attackRange);
      form.setValue("fleeThreshold", defaultTemplate.fleeThreshold);
      form.setValue("waypointArrivalDistance", defaultTemplate.waypointArrivalDistance);
      form.setValue("pathfindingUpdateInterval", defaultTemplate.pathfindingUpdateInterval);
      form.setValue("obstacleAvoidanceDistance", defaultTemplate.obstacleAvoidanceDistance);
      form.setValue("formationKeepingTolerance", defaultTemplate.formationKeepingTolerance);
    }
  };

  // Get ship type badge color
  const getShipTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'enemy': return 'bg-destructive text-destructive-foreground';
      case 'transport': return 'bg-blue-500 text-white';
      case 'civilian': return 'bg-green-500 text-white';
      case 'mining': return 'bg-amber-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };
  
  // Format templates for display
  interface ApiResponse {
    success: boolean;
    data: ShipTemplate[];
  }
  
  const templates = templatesData ? (templatesData as ApiResponse).data || [] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ship Editor</h1>
          <p className="text-muted-foreground">Design and configure ship templates for use in the game</p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center text-xs">
                  <Button onClick={() => refetch()} size="sm" variant="ghost">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh ship templates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <Clipboard className="h-4 w-4 mr-2" />
            Ship Templates
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Settings className="h-4 w-4 mr-2" />
            Detailed Editor
          </TabsTrigger>
          <TabsTrigger value="specialized" disabled={!selectedTemplate}>
            <FileCode2 className="h-4 w-4 mr-2" />
            Advanced Tuning
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4 mt-6">
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
        </TabsContent>
        
        <TabsContent value="editor" className="space-y-4 mt-6">
          {!selectedTemplate ? (
            <div className="text-center p-12">
              <Ship className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-1">No Template Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a template from the list or create a new one to edit its advanced parameters
              </p>
              <Button onClick={() => setActiveTab("templates")}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Go to Templates
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Advanced Configuration
                  </CardTitle>
                  <CardDescription>
                    Core configuration of the ship template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Template ID</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.templateId || "Not assigned"}</p>
                    </div>
                    <Badge variant="outline" className={getShipTypeBadgeColor(selectedTemplate.type)}>
                      {selectedTemplate.type.charAt(0).toUpperCase() + selectedTemplate.type.slice(1)}
                    </Badge>
                  </div>
                  
                  <Separator />

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="detail-name">Name</Label>
                      <Input 
                        id="detail-name" 
                        value={selectedTemplate.name} 
                        onChange={e => {
                          setSelectedTemplate({...selectedTemplate, name: e.target.value});
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="detail-description">Description</Label>
                      <Input 
                        id="detail-description" 
                        value={selectedTemplate.description || ""} 
                        onChange={e => {
                          setSelectedTemplate({...selectedTemplate, description: e.target.value});
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="detail-type">Ship Type</Label>
                      <Select 
                        value={selectedTemplate.type} 
                        onValueChange={value => {
                          setSelectedTemplate({...selectedTemplate, type: value as any});
                        }}
                      >
                        <SelectTrigger id="detail-type">
                          <SelectValue placeholder="Select ship type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enemy">Combat</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="civilian">Civilian</SelectItem>
                          <SelectItem value="mining">Mining</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => {
                      handleEditTemplate(selectedTemplate);
                      setDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Ship className="h-5 w-5 mr-2" />
                    Performance Characteristics
                  </CardTitle>
                  <CardDescription>
                    Physical properties and movement capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-mass">Mass (tons)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.mass}</span>
                      </div>
                      <Slider
                        id="detail-mass"
                        value={[selectedTemplate.mass]}
                        min={100}
                        max={10000}
                        step={100}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, mass: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-speed">Max Speed (m/s)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.maxSpeed}</span>
                      </div>
                      <Slider
                        id="detail-speed"
                        value={[selectedTemplate.maxSpeed]}
                        min={10}
                        max={200}
                        step={5}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, maxSpeed: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-acceleration">Max Acceleration (m/s²)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.maxAcceleration}</span>
                      </div>
                      <Slider
                        id="detail-acceleration"
                        value={[selectedTemplate.maxAcceleration]}
                        min={1}
                        max={30}
                        step={1}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, maxAcceleration: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-turn">Turn Rate (rad/s)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.turnRate.toFixed(2)}</span>
                      </div>
                      <Slider
                        id="detail-turn"
                        value={[selectedTemplate.turnRate]}
                        min={0.01}
                        max={0.5}
                        step={0.01}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, turnRate: value});
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Radar className="h-5 w-5 mr-2" />
                    Sensor & Detection
                  </CardTitle>
                  <CardDescription>
                    Scanning and signature capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-detection">Detection Range (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.detectionRange}</span>
                      </div>
                      <Slider
                        id="detail-detection"
                        value={[selectedTemplate.detectionRange]}
                        min={100}
                        max={5000}
                        step={100}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, detectionRange: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-signature">Signature Radius (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.signatureRadius}</span>
                      </div>
                      <Slider
                        id="detail-signature"
                        value={[selectedTemplate.signatureRadius]}
                        min={10}
                        max={500}
                        step={10}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, signatureRadius: value});
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Combat Parameters
                  </CardTitle>
                  <CardDescription>
                    Attack and defensive capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-attack">Attack Range (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.attackRange}</span>
                      </div>
                      <Slider
                        id="detail-attack"
                        value={[selectedTemplate.attackRange]}
                        min={0}
                        max={1000}
                        step={50}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, attackRange: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-flee">Flee Threshold</Label>
                        <span className="text-sm font-mono">{selectedTemplate.fleeThreshold.toFixed(1)}</span>
                      </div>
                      <Slider
                        id="detail-flee"
                        value={[selectedTemplate.fleeThreshold]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, fleeThreshold: value});
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Health percentage at which the ship will attempt to flee from combat
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CornerDownRight className="h-5 w-5 mr-2" />
                    Advanced Navigation Parameters
                  </CardTitle>
                  <CardDescription>
                    Specialized pathfinding and obstacle avoidance settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-waypoint">Waypoint Arrival Distance (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.waypointArrivalDistance}</span>
                      </div>
                      <Slider
                        id="detail-waypoint"
                        value={[selectedTemplate.waypointArrivalDistance]}
                        min={10}
                        max={300}
                        step={10}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, waypointArrivalDistance: value});
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Distance at which a waypoint is considered reached
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-pathfinding">Pathfinding Update Interval (ms)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.pathfindingUpdateInterval}</span>
                      </div>
                      <Slider
                        id="detail-pathfinding"
                        value={[selectedTemplate.pathfindingUpdateInterval]}
                        min={1000}
                        max={10000}
                        step={1000}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, pathfindingUpdateInterval: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-obstacle">Obstacle Avoidance Distance (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.obstacleAvoidanceDistance}</span>
                      </div>
                      <Slider
                        id="detail-obstacle"
                        value={[selectedTemplate.obstacleAvoidanceDistance]}
                        min={50}
                        max={500}
                        step={50}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, obstacleAvoidanceDistance: value});
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="detail-formation">Formation Keeping Tolerance (m)</Label>
                        <span className="text-sm font-mono">{selectedTemplate.formationKeepingTolerance}</span>
                      </div>
                      <Slider
                        id="detail-formation"
                        value={[selectedTemplate.formationKeepingTolerance]}
                        min={10}
                        max={200}
                        step={10}
                        onValueChange={([value]) => {
                          setSelectedTemplate({...selectedTemplate, formationKeepingTolerance: value});
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How precisely the ship maintains its position in formation
                      </p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-3">Type-Specific Navigation Controls</h4>
                      
                      {selectedTemplate.type === 'transport' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="auto-routing">Auto Routing</Label>
                              <p className="text-xs text-muted-foreground">Calculate efficient trade routes</p>
                            </div>
                            <Switch id="auto-routing" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="convoy-capability">Convoy Capability</Label>
                              <p className="text-xs text-muted-foreground">Can lead transport convoys</p>
                            </div>
                            <Switch id="convoy-capability" />
                          </div>
                          
                          <div className="space-y-1 mt-3">
                            <Label>Cargo Priority</Label>
                            <Select defaultValue="balanced">
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="speed">Speed Priority</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="capacity">Capacity Priority</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      
                      {selectedTemplate.type === 'enemy' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="intercept-capability">Interception</Label>
                              <p className="text-xs text-muted-foreground">Advanced target interception</p>
                            </div>
                            <Switch id="intercept-capability" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="tactical-movement">Tactical Movement</Label>
                              <p className="text-xs text-muted-foreground">Use tactical movement patterns</p>
                            </div>
                            <Switch id="tactical-movement" defaultChecked />
                          </div>
                          
                          <div className="space-y-1 mt-3">
                            <Label>Combat Stance</Label>
                            <Select defaultValue="balanced">
                              <SelectTrigger>
                                <SelectValue placeholder="Select stance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aggressive">Aggressive</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="defensive">Defensive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      
                      {selectedTemplate.type === 'mining' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="resource-scanning">Resource Scanning</Label>
                              <p className="text-xs text-muted-foreground">Scan for optimal mining locations</p>
                            </div>
                            <Switch id="resource-scanning" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="precision-approach">Precision Approach</Label>
                              <p className="text-xs text-muted-foreground">Precise positioning near asteroids</p>
                            </div>
                            <Switch id="precision-approach" defaultChecked />
                          </div>
                          
                          <div className="space-y-1 mt-3">
                            <Label>Mining Method</Label>
                            <Select defaultValue="laser">
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="laser">Laser Mining</SelectItem>
                                <SelectItem value="fracture">Fracture Mining</SelectItem>
                                <SelectItem value="collector">Collector Mining</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      
                      {selectedTemplate.type === 'civilian' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="civilian-routes">Civilian Routes</Label>
                              <p className="text-xs text-muted-foreground">Follow established civilian routes</p>
                            </div>
                            <Switch id="civilian-routes" defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="safe-pathing">Safe Pathing</Label>
                              <p className="text-xs text-muted-foreground">Prioritize safety over efficiency</p>
                            </div>
                            <Switch id="safe-pathing" defaultChecked />
                          </div>
                          
                          <div className="space-y-1 mt-3">
                            <Label>Traffic Pattern</Label>
                            <Select defaultValue="standard">
                              <SelectTrigger>
                                <SelectValue placeholder="Select pattern" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="touring">Touring</SelectItem>
                                <SelectItem value="commuter">Commuter</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="lg:col-span-2 flex justify-end mt-4">
                <div className="space-x-4">
                  <Button variant="outline" onClick={() => setActiveTab("templates")}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Back to Templates
                  </Button>
                  <Button 
                    onClick={() => {
                      handleEditTemplate(selectedTemplate);
                      setDialogOpen(true);
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="specialized" className="space-y-4 mt-6">
          {!selectedTemplate ? (
            <div className="text-center p-12">
              <FileCode2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-1">No Template Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a template from the list to access advanced fine-tuning options
              </p>
              <Button onClick={() => setActiveTab("templates")}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Go to Templates
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Type-specific cards based on the ship type */}
              {selectedTemplate.type === 'enemy' && (
                <>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Combat Fine-Tuning
                      </CardTitle>
                      <CardDescription>
                        Specialized combat parameters for engagement tactics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="accuracy">Weapon Accuracy (%)</Label>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-sm">Low</span>
                            <Slider
                              id="accuracy"
                              defaultValue={[75]}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm">High</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher accuracy increases chance of hitting targets
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="range-priority">Range Priority</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger id="range-priority" className="mt-2">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="close">Close Combat</SelectItem>
                              <SelectItem value="medium">Medium Range</SelectItem>
                              <SelectItem value="long">Long Range</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Preferred engagement distance from targets
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="weapon-cycle">Weapon Cycling</Label>
                          <Select defaultValue="efficiency">
                            <SelectTrigger id="weapon-cycle" className="mt-2">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="burst">Burst Fire</SelectItem>
                              <SelectItem value="efficiency">Efficiency Mode</SelectItem>
                              <SelectItem value="continuous">Continuous Fire</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Controls weapon firing patterns
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="critical-hits">Critical Hit System</Label>
                            <p className="text-xs text-muted-foreground">Target subsystems for critical hits</p>
                          </div>
                          <Switch id="critical-hits" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Power Distribution
                      </CardTitle>
                      <CardDescription>
                        Allocate ship power to different systems
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Weapons Systems</Label>
                            <span className="text-sm font-mono">40%</span>
                          </div>
                          <Slider
                            defaultValue={[40]}
                            max={100}
                            step={5}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Shield Systems</Label>
                            <span className="text-sm font-mono">30%</span>
                          </div>
                          <Slider
                            defaultValue={[30]}
                            max={100}
                            step={5}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Engine Systems</Label>
                            <span className="text-sm font-mono">30%</span>
                          </div>
                          <Slider
                            defaultValue={[30]}
                            max={100}
                            step={5}
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Note: Total power allocation must equal 100%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {selectedTemplate.type === 'transport' && (
                <>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Box className="h-5 w-5 mr-2" />
                        Cargo Configuration
                      </CardTitle>
                      <CardDescription>
                        Specialized cargo and load management
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cargo-capacity">Cargo Capacity (tons)</Label>
                          <Input
                            id="cargo-capacity"
                            type="number"
                            defaultValue="1000"
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum cargo weight that can be carried
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="load-balancing">Load Balancing System</Label>
                          <Select defaultValue="automatic">
                            <SelectTrigger id="load-balancing" className="mt-2">
                              <SelectValue placeholder="Select system" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Controls how cargo is distributed for stability
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="secure-cargo">Secure Cargo System</Label>
                            <p className="text-xs text-muted-foreground">Enhanced protection against cargo loss</p>
                          </div>
                          <Switch id="secure-cargo" defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="hazardous-cargo">Hazardous Cargo Handling</Label>
                            <p className="text-xs text-muted-foreground">Special containment for sensitive materials</p>
                          </div>
                          <Switch id="hazardous-cargo" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Ship className="h-5 w-5 mr-2" />
                        Transport Specialization
                      </CardTitle>
                      <CardDescription>
                        Specific transport role and features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="transport-class">Transport Class</Label>
                          <Select defaultValue="medium">
                            <SelectTrigger id="transport-class" className="mt-2">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light Courier</SelectItem>
                              <SelectItem value="medium">Medium Freighter</SelectItem>
                              <SelectItem value="heavy">Heavy Hauler</SelectItem>
                              <SelectItem value="bulk">Bulk Transport</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="cargo-type">Specialized Cargo Type</Label>
                          <Select defaultValue="general">
                            <SelectTrigger id="cargo-type" className="mt-2">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Cargo</SelectItem>
                              <SelectItem value="liquid">Liquid Transport</SelectItem>
                              <SelectItem value="container">Container Shipping</SelectItem>
                              <SelectItem value="ore">Ore Transport</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-2 space-y-3">
                          <Label>Auxiliary Systems</Label>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="quick-load" />
                              <Label htmlFor="quick-load" className="text-sm">Quick Loading</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="auto-dock" />
                              <Label htmlFor="auto-dock" className="text-sm">Auto-Docking</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="extended-range" defaultChecked />
                              <Label htmlFor="extended-range" className="text-sm">Extended Range</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="defensive-systems" />
                              <Label htmlFor="defensive-systems" className="text-sm">Defensive Systems</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {selectedTemplate.type === 'mining' && (
                <>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        Mining Equipment
                      </CardTitle>
                      <CardDescription>
                        Specialized resource extraction tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="mining-laser">Mining Laser Power (kW)</Label>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-sm">Low</span>
                            <Slider
                              id="mining-laser"
                              defaultValue={[60]}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-sm">High</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher power increases extraction rate but consumes more energy
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="extraction-method">Primary Extraction Method</Label>
                          <Select defaultValue="laser">
                            <SelectTrigger id="extraction-method" className="mt-2">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="laser">Laser Mining</SelectItem>
                              <SelectItem value="drill">Drill Extraction</SelectItem>
                              <SelectItem value="scoop">Scoop Collection</SelectItem>
                              <SelectItem value="fracture">Fracture Mining</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="mineral-scanner">Advanced Mineral Scanner</Label>
                            <p className="text-xs text-muted-foreground">Detect valuable resources at greater range</p>
                          </div>
                          <Switch id="mineral-scanner" defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="auto-refinery">Onboard Auto-Refinery</Label>
                            <p className="text-xs text-muted-foreground">Process raw materials during extraction</p>
                          </div>
                          <Switch id="auto-refinery" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Mining Operations
                      </CardTitle>
                      <CardDescription>
                        Specialized mining behavior settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="target-material">Target Material Priority</Label>
                          <Select defaultValue="balanced">
                            <SelectTrigger id="target-material" className="mt-2">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common Materials</SelectItem>
                              <SelectItem value="balanced">Balanced Approach</SelectItem>
                              <SelectItem value="rare">Rare Materials</SelectItem>
                              <SelectItem value="valuable">High Value Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="operation-mode">Operation Mode</Label>
                          <Select defaultValue="efficiency">
                            <SelectTrigger id="operation-mode" className="mt-2">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="speed">Speed Priority</SelectItem>
                              <SelectItem value="efficiency">Efficiency Priority</SelectItem>
                              <SelectItem value="precision">Precision Priority</SelectItem>
                              <SelectItem value="volume">Volume Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Area Coverage</Label>
                          <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="wide-scan" defaultChecked />
                              <Label htmlFor="wide-scan" className="text-sm">Wide Area Scan</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="deep-scan" />
                              <Label htmlFor="deep-scan" className="text-sm">Deep Core Scan</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="multi-point" defaultChecked />
                              <Label htmlFor="multi-point" className="text-sm">Multi-point Collection</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="fragment-tracking" />
                              <Label htmlFor="fragment-tracking" className="text-sm">Fragment Tracking</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {selectedTemplate.type === 'civilian' && (
                <>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Ship className="h-5 w-5 mr-2" />
                        Civilian Specialization
                      </CardTitle>
                      <CardDescription>
                        Civilian vessel purpose and capabilities
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="vessel-type">Vessel Type</Label>
                          <Select defaultValue="passenger">
                            <SelectTrigger id="vessel-type" className="mt-2">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passenger">Passenger Transport</SelectItem>
                              <SelectItem value="research">Research Vessel</SelectItem>
                              <SelectItem value="medical">Medical Ship</SelectItem>
                              <SelectItem value="survey">Survey Vessel</SelectItem>
                              <SelectItem value="luxury">Luxury Liner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="capacity">Passenger Capacity</Label>
                          <Input
                            id="capacity"
                            type="number"
                            defaultValue="200"
                            className="mt-2"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="auto-navigation">Enhanced Navigation AI</Label>
                            <p className="text-xs text-muted-foreground">Improved route planning and hazard avoidance</p>
                          </div>
                          <Switch id="auto-navigation" defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="distress-beacon">Advanced Distress Beacon</Label>
                            <p className="text-xs text-muted-foreground">Increased signal range during emergencies</p>
                          </div>
                          <Switch id="distress-beacon" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Safety Systems
                      </CardTitle>
                      <CardDescription>
                        Specialized civilian safety features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="emergency-protocol">Emergency Protocol</Label>
                          <Select defaultValue="evacuate">
                            <SelectTrigger id="emergency-protocol" className="mt-2">
                              <SelectValue placeholder="Select protocol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fight">Defensive Stance</SelectItem>
                              <SelectItem value="evacuate">Immediate Evacuation</SelectItem>
                              <SelectItem value="hide">Stealth Protocol</SelectItem>
                              <SelectItem value="distract">Distraction Protocol</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Safety Features</Label>
                          <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="escape-pods" defaultChecked />
                              <Label htmlFor="escape-pods" className="text-sm">Escape Pods</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="emergency-shields" />
                              <Label htmlFor="emergency-shields" className="text-sm">Emergency Shields</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="redundant-systems" defaultChecked />
                              <Label htmlFor="redundant-systems" className="text-sm">Redundant Systems</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="anti-boarding" />
                              <Label htmlFor="anti-boarding" className="text-sm">Anti-Boarding</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="comfort-level">Comfort Level</Label>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-sm">Basic</span>
                            <Slider
                              id="comfort-level"
                              defaultValue={[70]}
                              max={100}
                              step={10}
                              className="flex-1"
                            />
                            <span className="text-sm">Luxury</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher comfort increases passenger satisfaction
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              <div className="lg:col-span-2 flex justify-end mt-4">
                <div className="space-x-4">
                  <Button variant="outline" onClick={() => setActiveTab("templates")}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Back to Templates
                  </Button>
                  <Button 
                    onClick={() => {
                      handleEditTemplate(selectedTemplate);
                      setDialogOpen(true);
                      toast({
                        title: "Advanced Settings Saved",
                        description: "Specialized parameters have been applied to the template",
                      });
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Apply Advanced Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Template Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Ship Template" : "Create New Ship Template"}
            </DialogTitle>
            <DialogDescription>
              Configure the specifications and behavior of this ship template
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Basic Information
                    </h3>
                  
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ship Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter ship name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ship Type</FormLabel>
                          <Select 
                            onValueChange={handleShipTypeChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ship type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="enemy">Combat</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="civilian">Civilian</SelectItem>
                              <SelectItem value="mining">Mining</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Ship description" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Performance
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="mass"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Mass (tons)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={10000}
                              step={10}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Max Speed (m/s)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={200}
                              step={1}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxAcceleration"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Acceleration (m/s²)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={1}
                              max={50}
                              step={0.5}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="turnRate"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Turn Rate (rad/s)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0.01}
                              max={0.5}
                              step={0.01}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Radar className="h-4 w-4 mr-2" />
                      Sensors & Detection
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="detectionRange"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Detection Range (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={100}
                              max={5000}
                              step={100}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="signatureRadius"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Signature Radius (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={500}
                              step={10}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Combat & Defense
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="attackRange"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Attack Range (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1000}
                              step={50}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fleeThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Flee Threshold</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value * 100}%
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.05}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <CornerDownRight className="h-4 w-4 mr-2" />
                      Navigation
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="waypointArrivalDistance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Waypoint Arrival Distance (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={500}
                              step={10}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="obstacleAvoidanceDistance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Obstacle Avoidance Distance (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={50}
                              max={500}
                              step={10}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="formationKeepingTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between">
                            <FormLabel>Formation Tolerance (m)</FormLabel>
                            <span className="text-sm text-muted-foreground">
                              {field.value}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              min={10}
                              max={200}
                              step={5}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={saveTemplateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ship Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ship template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center p-3 border rounded-md bg-muted/50">
            <Info className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Deleting this template will not affect any ships that have already been spawned with it.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}