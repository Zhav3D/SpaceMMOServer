import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, PenLine, RefreshCw } from "lucide-react";

interface CelestialBody {
  id: number;
  name: string;
  type: string;
  radius: number;
  mass: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  orbitalPeriod: number;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  parentBodyId: number | null;
  color: string;
  // From API:
  currentPositionX: number;
  currentPositionY: number;
  currentPositionZ: number;
  currentVelocityX: number;
  currentVelocityY: number;
  currentVelocityZ: number;
  orbitProgress: number;
}

interface CelestialBodyEditorProps {
  onEdit?: () => void;
}

type CelestialBodyType = "planet" | "star" | "moon" | "asteroid" | "comet" | "station";

export default function CelestialBodyEditor({ onEdit }: CelestialBodyEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("planets");
  const [selectedBody, setSelectedBody] = useState<CelestialBody | null>(null);
  
  const { toast } = useToast();
  
  // Form state for new body
  const [newBody, setNewBody] = useState<Partial<CelestialBody>>({
    name: "",
    type: "planet",
    radius: 0,
    mass: 0,
    semiMajorAxis: 0,
    eccentricity: 0,
    inclination: 0,
    color: "#3498db",
    parentBodyId: 1, // Default to orbiting the sun
  });
  
  // Fetch celestial bodies data
  const { data: celestialData, isLoading, error } = useQuery({
    queryKey: ["/api/celestial"],
    refetchInterval: 5000
  });
  
  const bodies = celestialData?.data || [];
  
  // Add new celestial body
  const addBodyMutation = useMutation({
    mutationFn: async (body: Partial<CelestialBody>) => {
      const response = await fetch("/api/celestial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to add celestial body");
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      setNewBody({
        name: "",
        type: "planet",
        radius: 0,
        mass: 0,
        semiMajorAxis: 0,
        eccentricity: 0,
        inclination: 0,
        color: "#3498db",
        parentBodyId: 1,
      });
      setIsAddDialogOpen(false);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/celestial"] });
      
      toast({
        title: "Success",
        description: "Celestial body added successfully",
      });
      
      if (onEdit) onEdit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add celestial body: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Edit celestial body
  const editBodyMutation = useMutation({
    mutationFn: async (body: Partial<CelestialBody>) => {
      const response = await fetch(`/api/celestial/${body.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to update celestial body");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedBody(null);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/celestial"] });
      
      toast({
        title: "Success",
        description: "Celestial body updated successfully",
      });
      
      if (onEdit) onEdit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update celestial body: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete celestial body
  const deleteBodyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/celestial/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete celestial body");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedBody(null);
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/celestial"] });
      
      toast({
        title: "Success",
        description: "Celestial body deleted successfully",
      });
      
      if (onEdit) onEdit();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete celestial body: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Generate predefined celestial body templates
  const getBodyTemplate = (type: CelestialBodyType, parentId: number = 1): Partial<CelestialBody> => {
    switch (type) {
      case "planet":
        return {
          name: "New Planet",
          type: "planet",
          radius: 6000000, // Earth-like
          mass: 5.97e24, // Earth-like
          semiMajorAxis: 150000000000, // 1 AU
          eccentricity: 0.02, // Slightly eccentric
          inclination: 0.05, // Small inclination
          color: "#3498db",
          parentBodyId: parentId,
        };
      case "moon":
        return {
          name: "New Moon",
          type: "moon",
          radius: 1700000, // Moon-like
          mass: 7.35e22, // Moon-like
          semiMajorAxis: 384000000, // Similar to Earth's moon
          eccentricity: 0.055, // Similar to Earth's moon
          inclination: 0.09, // Small inclination
          color: "#95a5a6",
          parentBodyId: parentId, // Default to Earth
        };
      case "asteroid":
        return {
          name: "New Asteroid",
          type: "asteroid",
          radius: 5000, // Small
          mass: 1e15, // Very small
          semiMajorAxis: 400000000000, // Asteroid belt
          eccentricity: 0.15, // Moderate eccentricity
          inclination: 0.2, // Moderate inclination
          color: "#7f8c8d",
          parentBodyId: parentId,
        };
      case "comet":
        return {
          name: "New Comet",
          type: "comet",
          radius: 10000, // Small
          mass: 1e13, // Very small
          semiMajorAxis: 3000000000000, // Far out
          eccentricity: 0.9, // Very eccentric
          inclination: 0.8, // High inclination
          color: "#2ecc71",
          parentBodyId: parentId,
        };
      case "station":
        return {
          name: "New Space Station",
          type: "station",
          radius: 100, // Very small
          mass: 1e5, // Very small
          semiMajorAxis: 150000000000, // Earth orbit
          eccentricity: 0.001, // Nearly circular
          inclination: 0.01, // Small inclination
          color: "#f1c40f",
          parentBodyId: parentId,
        };
      case "star":
      default:
        return {
          name: "New Star",
          type: "star",
          radius: 696340000, // Sun-like
          mass: 1.989e30, // Sun-like
          semiMajorAxis: 0, // Center of the system
          eccentricity: 0,
          inclination: 0,
          color: "#f39c12",
          parentBodyId: null, // No parent
        };
    }
  };
  
  const handleAddClick = (type: CelestialBodyType) => {
    // Get parent body based on type
    let parentId = 1; // Default Sun
    
    if (type === "moon") {
      // For moons, default to Earth or another planet
      const planet = bodies.find(b => b.type === "planet");
      if (planet) parentId = planet.id;
    }
    
    setNewBody(getBodyTemplate(type, parentId));
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitNewBody = () => {
    addBodyMutation.mutate(newBody);
  };
  
  const handleSubmitEditBody = () => {
    if (selectedBody) {
      editBodyMutation.mutate(selectedBody);
    }
  };
  
  // Filter bodies based on active tab
  const filteredBodies = bodies.filter(body => {
    switch (activeTab) {
      case "planets":
        return body.type === "planet";
      case "moons":
        return body.type === "moon";
      case "asteroids":
        return body.type === "asteroid" || body.type === "comet";
      case "stations":
        return body.type === "station";
      case "stars":
        return body.type === "star";
      default:
        return true;
    }
  });
  
  // Helper function to format large numbers
  const formatLargeNumber = (num: number, precision: number = 2): string => {
    if (num === 0) return "0";
    
    const absNum = Math.abs(num);
    if (absNum < 1000) return num.toFixed(precision);
    
    const units = ["", "k", "M", "B", "T", "Q"];
    const exponent = Math.min(Math.floor(Math.log10(absNum) / 3), units.length - 1);
    const scaled = absNum / Math.pow(10, exponent * 3);
    
    return `${scaled.toFixed(precision)}${units[exponent]}`;
  };
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="planets" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="planets">Planets</TabsTrigger>
            <TabsTrigger value="moons">Moons</TabsTrigger>
            <TabsTrigger value="asteroids">Asteroids</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="stars">Stars</TabsTrigger>
          </TabsList>
          
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/celestial"] })}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add {activeTab.slice(0, -1)}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Celestial Body</DialogTitle>
                  <DialogDescription>
                    Create a new celestial object in the solar system
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newBody.name}
                        onChange={(e) => setNewBody({ ...newBody, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newBody.type}
                        onValueChange={(value) => setNewBody({ ...newBody, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planet">Planet</SelectItem>
                          <SelectItem value="moon">Moon</SelectItem>
                          <SelectItem value="asteroid">Asteroid</SelectItem>
                          <SelectItem value="comet">Comet</SelectItem>
                          <SelectItem value="station">Space Station</SelectItem>
                          <SelectItem value="star">Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="radius">Radius (m)</Label>
                      <Input
                        id="radius"
                        type="number"
                        value={newBody.radius}
                        onChange={(e) => setNewBody({ ...newBody, radius: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mass">Mass (kg)</Label>
                      <Input
                        id="mass"
                        type="number"
                        value={newBody.mass}
                        onChange={(e) => setNewBody({ ...newBody, mass: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semiMajorAxis">Semi-Major Axis (m)</Label>
                      <Input
                        id="semiMajorAxis"
                        type="number"
                        value={newBody.semiMajorAxis}
                        onChange={(e) => setNewBody({ ...newBody, semiMajorAxis: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eccentricity">Eccentricity</Label>
                      <Input
                        id="eccentricity"
                        type="number"
                        min="0"
                        max="0.99"
                        step="0.01"
                        value={newBody.eccentricity}
                        onChange={(e) => setNewBody({ ...newBody, eccentricity: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inclination">Inclination (rad)</Label>
                      <Input
                        id="inclination"
                        type="number"
                        min="0"
                        max={Math.PI}
                        step="0.01"
                        value={newBody.inclination}
                        onChange={(e) => setNewBody({ ...newBody, inclination: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="color"
                          type="color"
                          value={newBody.color}
                          onChange={(e) => setNewBody({ ...newBody, color: e.target.value })}
                          className="w-12"
                        />
                        <Input
                          value={newBody.color}
                          onChange={(e) => setNewBody({ ...newBody, color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentBody">Parent Body</Label>
                    <Select
                      value={newBody.parentBodyId?.toString() || "null"}
                      onValueChange={(value) => setNewBody({ 
                        ...newBody, 
                        parentBodyId: value === "null" ? null : parseInt(value)
                      })}
                    >
                      <SelectTrigger id="parentBody">
                        <SelectValue placeholder="Select parent body" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">None (Center of System)</SelectItem>
                        {bodies.map((body) => (
                          <SelectItem key={body.id} value={body.id.toString()}>
                            {body.name} ({body.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmitNewBody} disabled={addBodyMutation.isPending}>
                    {addBodyMutation.isPending ? 'Adding...' : 'Add Body'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <TabsContent value="planets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBodies.map((body) => (
              <Card key={body.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2" style={{ borderBottom: `3px solid ${body.color}`}}>
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>{body.name}</span>
                    <span className="text-xs text-muted-foreground">{body.type}</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 pt-2 text-sm space-y-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>Radius: {formatLargeNumber(body.radius)} m</div>
                    <div>Mass: {formatLargeNumber(body.mass)} kg</div>
                    <div>Orbit: {formatLargeNumber(body.semiMajorAxis)} m</div>
                    <div>Eccentricity: {body.eccentricity.toFixed(3)}</div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-2 px-4 flex justify-end">
                  <Dialog open={isEditDialogOpen && selectedBody?.id === body.id} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) setSelectedBody(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBody(body)}>
                        <PenLine className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    
                    {selectedBody && selectedBody.id === body.id && (
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Celestial Body</DialogTitle>
                          <DialogDescription>
                            Modify the properties of {selectedBody.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Name</Label>
                              <Input
                                id="edit-name"
                                value={selectedBody.name}
                                onChange={(e) => setSelectedBody({ ...selectedBody, name: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-type">Type</Label>
                              <Select
                                value={selectedBody.type}
                                onValueChange={(value) => setSelectedBody({ ...selectedBody, type: value })}
                              >
                                <SelectTrigger id="edit-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planet">Planet</SelectItem>
                                  <SelectItem value="moon">Moon</SelectItem>
                                  <SelectItem value="asteroid">Asteroid</SelectItem>
                                  <SelectItem value="comet">Comet</SelectItem>
                                  <SelectItem value="station">Space Station</SelectItem>
                                  <SelectItem value="star">Star</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-radius">Radius (m)</Label>
                              <Input
                                id="edit-radius"
                                type="number"
                                value={selectedBody.radius}
                                onChange={(e) => setSelectedBody({ 
                                  ...selectedBody, 
                                  radius: parseFloat(e.target.value) 
                                })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-mass">Mass (kg)</Label>
                              <Input
                                id="edit-mass"
                                type="number"
                                value={selectedBody.mass}
                                onChange={(e) => setSelectedBody({ 
                                  ...selectedBody, 
                                  mass: parseFloat(e.target.value) 
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-semiMajorAxis">Semi-Major Axis (m)</Label>
                              <Input
                                id="edit-semiMajorAxis"
                                type="number"
                                value={selectedBody.semiMajorAxis}
                                onChange={(e) => setSelectedBody({ 
                                  ...selectedBody, 
                                  semiMajorAxis: parseFloat(e.target.value) 
                                })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-eccentricity">Eccentricity</Label>
                              <Input
                                id="edit-eccentricity"
                                type="number"
                                min="0"
                                max="0.99"
                                step="0.01"
                                value={selectedBody.eccentricity}
                                onChange={(e) => setSelectedBody({ 
                                  ...selectedBody, 
                                  eccentricity: parseFloat(e.target.value) 
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-inclination">Inclination (rad)</Label>
                              <Input
                                id="edit-inclination"
                                type="number"
                                min="0"
                                max={Math.PI}
                                step="0.01"
                                value={selectedBody.inclination}
                                onChange={(e) => setSelectedBody({ 
                                  ...selectedBody, 
                                  inclination: parseFloat(e.target.value) 
                                })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-color">Color</Label>
                              <div className="flex space-x-2">
                                <Input
                                  id="edit-color"
                                  type="color"
                                  value={selectedBody.color}
                                  onChange={(e) => setSelectedBody({ 
                                    ...selectedBody, 
                                    color: e.target.value 
                                  })}
                                  className="w-12"
                                />
                                <Input
                                  value={selectedBody.color}
                                  onChange={(e) => setSelectedBody({ 
                                    ...selectedBody, 
                                    color: e.target.value 
                                  })}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-parentBody">Parent Body</Label>
                            <Select
                              value={selectedBody.parentBodyId?.toString() || "null"}
                              onValueChange={(value) => setSelectedBody({ 
                                ...selectedBody, 
                                parentBodyId: value === "null" ? null : parseInt(value) 
                              })}
                            >
                              <SelectTrigger id="edit-parentBody">
                                <SelectValue placeholder="Select parent body" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="null">None (Center of System)</SelectItem>
                                {bodies
                                  .filter(b => b.id !== selectedBody.id) // Can't be its own parent
                                  .map((body) => (
                                    <SelectItem key={body.id} value={body.id.toString()}>
                                      {body.name} ({body.type})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <DialogFooter className="flex justify-between">
                          <Button 
                            variant="destructive" 
                            onClick={() => deleteBodyMutation.mutate(selectedBody.id)}
                            disabled={deleteBodyMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {deleteBodyMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Button>
                          
                          <div className="space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedBody(null);
                                setIsEditDialogOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleSubmitEditBody}
                              disabled={editBodyMutation.isPending}
                            >
                              {editBodyMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
            
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleAddClick(activeTab === "planets" ? "planet" : 
                            activeTab === "moons" ? "moon" : 
                            activeTab === "asteroids" ? "asteroid" : 
                            activeTab === "stations" ? "station" : "star")}
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New {activeTab.slice(0, -1)}</p>
              <p className="text-xs text-muted-foreground">Create a new celestial body</p>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="moons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBodies.length > 0 ? (
              filteredBodies.map((body) => (
                <Card key={body.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2" style={{ borderBottom: `3px solid ${body.color}`}}>
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{body.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {body.parentBodyId && bodies.find(b => b.id === body.parentBodyId)?.name}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2 text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>Radius: {formatLargeNumber(body.radius)} m</div>
                      <div>Mass: {formatLargeNumber(body.mass)} kg</div>
                      <div>Orbit: {formatLargeNumber(body.semiMajorAxis)} m</div>
                      <div>Eccentricity: {body.eccentricity.toFixed(3)}</div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-2 px-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBody(body);
                      setIsEditDialogOpen(true);
                    }}>
                      <PenLine className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-6">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground mb-4">No moons found in the system</p>
                  <Button onClick={() => handleAddClick("moon")}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add First Moon
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleAddClick("moon")}
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New Moon</p>
              <p className="text-xs text-muted-foreground">Create a new moon orbiting a planet</p>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="asteroids" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBodies.length > 0 ? (
              filteredBodies.map((body) => (
                <Card key={body.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2" style={{ borderBottom: `3px solid ${body.color}`}}>
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{body.name}</span>
                      <span className="text-xs text-muted-foreground">{body.type}</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2 text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>Radius: {formatLargeNumber(body.radius)} m</div>
                      <div>Orbit: {formatLargeNumber(body.semiMajorAxis)} m</div>
                      <div>Eccentricity: {body.eccentricity.toFixed(3)}</div>
                      <div>Inclination: {body.inclination.toFixed(3)} rad</div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-2 px-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBody(body);
                      setIsEditDialogOpen(true);
                    }}>
                      <PenLine className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-6">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground mb-4">No asteroids or comets found in the system</p>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleAddClick("asteroid")}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Asteroid
                    </Button>
                    <Button onClick={() => handleAddClick("comet")}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Comet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleAddClick("asteroid")}
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New Asteroid</p>
              <p className="text-xs text-muted-foreground">Create a new asteroid</p>
            </Card>
            
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleAddClick("comet")}
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New Comet</p>
              <p className="text-xs text-muted-foreground">Create a new comet with eccentric orbit</p>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBodies.length > 0 ? (
              filteredBodies.map((body) => (
                <Card key={body.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2" style={{ borderBottom: `3px solid ${body.color}`}}>
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{body.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {body.parentBodyId && bodies.find(b => b.id === body.parentBodyId)?.name}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2 text-sm space-y-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>Radius: {formatLargeNumber(body.radius)} m</div>
                      <div>Mass: {formatLargeNumber(body.mass)} kg</div>
                      <div>Orbit: {formatLargeNumber(body.semiMajorAxis)} m</div>
                      <div>Eccentricity: {body.eccentricity.toFixed(3)}</div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-2 px-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBody(body);
                      setIsEditDialogOpen(true);
                    }}>
                      <PenLine className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-6">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground mb-4">No space stations found in the system</p>
                  <Button onClick={() => handleAddClick("station")}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add First Station
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleAddClick("station")}
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Add New Space Station</p>
              <p className="text-xs text-muted-foreground">Create a new artificial space station</p>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stars" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBodies.map((body) => (
              <Card key={body.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2" style={{ borderBottom: `3px solid ${body.color}`}}>
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>{body.name}</span>
                    <span className="text-xs text-muted-foreground">{body.type}</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 pt-2 text-sm space-y-1">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>Radius: {formatLargeNumber(body.radius)} m</div>
                    <div>Mass: {formatLargeNumber(body.mass)} kg</div>
                    <div>Position: Center</div>
                    <div>Type: {body.type}</div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-2 px-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedBody(body);
                    setIsEditDialogOpen(true);
                  }}>
                    <PenLine className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {/* Only show add star button if there are no stars */}
            {filteredBodies.length === 0 && (
              <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleAddClick("star")}
              >
                <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Add New Star</p>
                <p className="text-xs text-muted-foreground">Create a new star as system center</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}