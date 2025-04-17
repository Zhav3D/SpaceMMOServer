import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  percentage?: number;
  footer?: string;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor = 'primary',
  percentage = 0,
  footer,
  isLoading = false,
}: StatsCardProps) {
  // Function to get color class based on iconColor
  const getIconColorClass = (): string => {
    switch (iconColor) {
      case 'primary': return 'text-primary';
      case 'secondary': return 'text-indigo-400';
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-primary';
    }
  };
  
  // Function to get progress color class based on percentage
  const getProgressColorClass = (): string => {
    if (percentage > 80) return 'text-red-500';
    if (percentage > 60) return 'text-amber-500';
    return 'text-emerald-500';
  };
  
  return (
    <Card className="border-gray-800 shadow-lg bg-background-dark">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
              <div className={`rounded-full p-2 ${getIconColorClass()} bg-opacity-10`}>
                <span className="material-icons text-xl">{icon}</span>
              </div>
            </div>
            
            <div className="text-2xl font-bold mb-4">
              {value}
            </div>
            
            <Progress value={percentage} className={`h-1 mb-3 ${getProgressColorClass()}`} />
            
            {footer && (
              <div className="text-xs text-gray-400">
                {footer}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}