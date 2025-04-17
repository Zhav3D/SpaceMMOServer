import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AsteroidGenerator({ onGenerate }: { onGenerate?: () => void }) {
  const { toast } = useToast();
  const [count, setCount] = useState<number>(10);
  const [minDistance, setMinDistance] = useState<number>(350000000000); // Default: just outside Mars orbit
  const [maxDistance, setMaxDistance] = useState<number>(500000000000); // Default: inner asteroid belt
  const [generating, setGenerating] = useState<boolean>(false);
  
  // Add celestial body mutation
  const addAsteroidMutation = useMutation({
    mutationFn: async (asteroid: any) => {
      const response = await fetch("/api/celestial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asteroid),
      });
      if (!response.ok) {
        throw new Error("Failed to add asteroid");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the celestial bodies query to fetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/celestial"] });
    },
    onError: (error) => {
      console.error("Error adding asteroid:", error);
    },
  });
  
  // Random float between min and max
  const randomFloat = (min: number, max: number): number => {
    return min + Math.random() * (max - min);
  };
  
  // Random color generator (greys, browns for asteroids)
  const randomAsteroidColor = (): string => {
    const colors = [
      "#6D6D6D", // Grey
      "#8B7D6B", // Light brown
      "#8B7355", // Medium brown
      "#8B8378", // Warm grey
      "#5E5E5E", // Dark grey
      "#7F7F7F", // Medium grey
      "#A39480", // Taupe
      "#9C9C9C", // Silver
      "#8A7F6F", // Dark taupe
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Generate randomized asteroid parameters
  const generateAsteroid = (index: number) => {
    const semiMajorAxis = randomFloat(minDistance, maxDistance);
    
    // Realistic parameters for asteroids
    return {
      name: `Asteroid ${(new Date()).getFullYear()}-${String.fromCharCode(65 + (index % 26))}${Math.floor(Math.random() * 1000)}`,
      type: "asteroid",
      radius: randomFloat(500, 50000), // 0.5km to 50km
      mass: randomFloat(1e14, 1e18), // Typical asteroid mass
      semiMajorAxis: semiMajorAxis,
      eccentricity: randomFloat(0.05, 0.3), // Some have quite eccentric orbits
      inclination: randomFloat(0.01, 0.3), // Up to ~17 degrees inclination 
      color: randomAsteroidColor(),
      parentBodyId: 1, // Orbiting the sun
      
      // Additional orbital parameters (slightly randomized)
      longitudeOfAscendingNode: randomFloat(0, Math.PI * 2),
      argumentOfPeriapsis: randomFloat(0, Math.PI * 2),
      meanAnomaly: randomFloat(0, Math.PI * 2),
      
      // Initial position (will be calculated by the simulation)
      positionX: 0, 
      positionY: 0,
      positionZ: 0,
      velocityX: 0,
      velocityY: 0,
      velocityZ: 0,
    };
  };
  
  // Handle generation of multiple asteroids
  const handleGenerateAsteroids = async () => {
    if (count < 1) {
      toast({
        title: "Invalid count",
        description: "Please enter a positive number of asteroids to generate",
        variant: "destructive",
      });
      return;
    }
    
    if (count > 100) {
      toast({
        title: "Too many asteroids",
        description: "Please generate 100 or fewer asteroids at once",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    toast({
      title: "Generating asteroids",
      description: `Creating ${count} randomly generated asteroids...`,
    });
    
    try {
      // Create asteroids sequentially to avoid overwhelming the server
      for (let i = 0; i < count; i++) {
        const asteroid = generateAsteroid(i);
        await addAsteroidMutation.mutateAsync(asteroid);
        
        // Slight delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      toast({
        title: "Success",
        description: `Generated ${count} new asteroids successfully`,
      });
      
      if (onGenerate) {
        onGenerate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate all asteroids: ${error}`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Format large numbers in AU (Astronomical Units) for display
  const formatDistanceAU = (meters: number): string => {
    const AU = 149597870700; // meters
    return (meters / AU).toFixed(2) + " AU";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asteroid Belt Generator</CardTitle>
        <CardDescription>
          Generate multiple random asteroids to populate the asteroid belt
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="count">Number of Asteroids</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="count"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              min={1}
              max={100}
              className="w-20"
            />
            <Slider 
              value={[count]} 
              onValueChange={(value) => setCount(value[0])}
              min={1}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="distance-range">Distance Range (Asteroid Belt)</Label>
            <span className="text-xs text-muted-foreground">
              {formatDistanceAU(minDistance)} - {formatDistanceAU(maxDistance)}
            </span>
          </div>
          
          <div className="flex space-x-4">
            <div className="w-1/2">
              <Label htmlFor="min-distance" className="text-xs">Min Distance</Label>
              <Slider 
                value={[minDistance]} 
                onValueChange={(value) => setMinDistance(value[0])}
                min={100000000000} // Inside Mercury's orbit
                max={1000000000000} // Outside Jupiter
                step={10000000000}
                className="my-2"
              />
            </div>
            
            <div className="w-1/2">
              <Label htmlFor="max-distance" className="text-xs">Max Distance</Label>
              <Slider 
                value={[maxDistance]} 
                onValueChange={(value) => {
                  if (value[0] > minDistance) {
                    setMaxDistance(value[0]);
                  }
                }}
                min={minDistance}
                max={1000000000000} // Outside Jupiter
                step={10000000000}
                className="my-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleGenerateAsteroids}
          disabled={generating}
        >
          {generating
            ? "Generating Asteroids..."
            : `Generate ${count} Random Asteroids`}
        </Button>
      </CardFooter>
    </Card>
  );
}