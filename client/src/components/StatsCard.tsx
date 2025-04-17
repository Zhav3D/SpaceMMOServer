import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: "primary" | "secondary" | "info" | "success" | "warning" | "error";
  percentage: number;
  footer: string;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor,
  percentage,
  footer,
  isLoading = false,
}: StatsCardProps) {
  // Handle icon color variant
  const getIconColorClass = () => {
    switch (iconColor) {
      case "primary": return "bg-primary/20 text-primary";
      case "secondary": return "bg-secondary/20 text-secondary";
      case "info": return "bg-info/20 text-info";
      case "success": return "bg-success/20 text-success";
      case "warning": return "bg-warning/20 text-warning";
      case "error": return "bg-error/20 text-error";
      default: return "bg-primary/20 text-primary";
    }
  };

  // Handle progress bar color variant
  const getProgressColorClass = () => {
    switch (iconColor) {
      case "primary": return "text-primary";
      case "secondary": return "text-secondary";
      case "info": return "text-info";
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "error": return "text-error";
      default: return "text-primary";
    }
  };

  return (
    <Card className="bg-background-dark border-gray-800 shadow-lg overflow-hidden">
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[120px]" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-medium mt-1">{value}</p>
              </div>
              <div className={`rounded-full p-2 ${getIconColorClass()}`}>
                <span className="material-icons text-xl">{icon}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={percentage > 100 ? 100 : percentage} 
                className={`h-2 ${getProgressColorClass()}`} 
              />
              <p className="text-xs text-gray-400">{footer}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}