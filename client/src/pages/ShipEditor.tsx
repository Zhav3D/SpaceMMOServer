import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { 
  Ship, 
  Settings, 
  Clipboard, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Box, 
  Zap, 
  Shield, 
  Radar, 
  FileCode2
} from "lucide-react";

const ShipTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["enemy", "transport", "civilian", "mining"]),
  mass: z.number().min(10).max(10000),
  maxSpeed: z.number().min(10).max(200),
  maxAcceleration: z.number().min(1).max(50),
  turnRate: z.number().min(0.01).max(0.5),
  detectionRange: z.number().min(100).max(5000),
  signatureRadius: z.number().min(10).max(500),
  attackRange: z.number().min(0).max(1000),
  fleeThreshold: z.number().min(0).max(1),
  waypointArrivalDistance: z.number().min(10).max(500),
  obstacleAvoidanceDistance: z.number().min(50).max(500),
  formationKeepingTolerance: z.number().min(10).max(200),
  pathfindingUpdateInterval: z.number().min(1000).max(10000),
  description: z.string().optional(),
});

type ShipTemplate = z.infer<typeof ShipTemplateSchema>;

export default function ShipEditor() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // Form handling
  const form = useForm<ShipTemplate>({
    resolver: zodResolver(ShipTemplateSchema),
    defaultValues: {
      name: "",
      type: "enemy",
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
      pathfindingUpdateInterval: 5000,
      description: "",
    },
  });
  
  // Query for fetching ship templates
  const { data: templates = [], isLoading, refetch } = useQuery<ShipTemplate[]>({
    queryKey: ['/api/ship-templates'],
    throwOnError: false
  });
  
  // Mutation for saving ship templates
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: ShipTemplate) => {
      const url = editMode && template.id 
        ? `/api/ship-templates/${template.id}`
        : '/api/ship-templates';
        
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ship-templates'] });
      setDialogOpen(false);
      form.reset();
    }
  });
  
  // Mutation for deleting ship templates
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ship-templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ship-templates'] });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  });
  
  // Handler for ship type change
  const handleShipTypeChange = (value: string) => {
    form.setValue('type', value as any);
    
    // Adjust default values based on ship type
    if (value === 'enemy') {
      form.setValue('attackRange', 500);
      form.setValue('fleeThreshold', 0.3);
    } else if (value === 'transport') {
      form.setValue('maxSpeed', 40);
      form.setValue('mass', 2000);
    } else if (value === 'civilian') {
      form.setValue('fleeThreshold', 0.7);
      form.setValue('detectionRange', 800);
    } else if (value === 'mining') {
      form.setValue('maxSpeed', 30);
      form.setValue('turnRate', 0.05);
    }
  };
  
  // Handler for creating a new template
  const handleNewTemplate = (type: "enemy" | "transport" | "civilian" | "mining") => {
    setEditMode(false);
    form.reset({
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Ship`,
      type,
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
      pathfindingUpdateInterval: 5000,
      description: `A standard ${type} ship template`
    });
    setDialogOpen(true);
  };
  
  // Handler for editing a template
  const handleEditTemplate = (template: ShipTemplate) => {
    setEditMode(true);
    form.reset(template);
    setDialogOpen(true);
  };
  
  // Handler for form submission
  const onSubmit = (data: ShipTemplate) => {
    saveTemplateMutation.mutate(data);
  };
  
  // Handler for duplicating a template
  const handleDuplicateTemplate = (template: ShipTemplate) => {
    setEditMode(false);
    const { id, ...rest } = template as any;
    form.reset({
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
  
  // Basic settings form content
  const BasicSettingsForm = () => (
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
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center">
            <Radar className="h-4 w-4 mr-2" />
            Sensors
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
      </div>
    </div>
  );
  
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Refresh templates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">
                    <Settings className="h-4 w-4 mr-2" />
                    Basic Settings
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Radar className="h-4 w-4 mr-2" />
                    Advanced Properties
                  </TabsTrigger>
                  <TabsTrigger value="specialized">
                    <FileCode2 className="h-4 w-4 mr-2" />
                    Type Specialization
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <BasicSettingsForm />
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">Advanced Properties</h3>
                    <p className="text-muted-foreground">
                      These settings will be available in a future update.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="specialized" className="space-y-4 pt-4">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">Type Specialization</h3>
                    <p className="text-muted-foreground">
                      Specialized settings for {form.watch("type")} ships will be available in a future update.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveTemplateMutation.isPending}
                >
                  {saveTemplateMutation.isPending && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editMode ? "Save Changes" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
              onClick={() => {
                if (templateToDelete) {
                  deleteTemplateMutation.mutate(templateToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteTemplateMutation.isPending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}