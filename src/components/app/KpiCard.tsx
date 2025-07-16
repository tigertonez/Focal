
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { HelpCircle } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  help?: string;
  className?: string;
}

export function KpiCard({ label, value, icon, help, className }: KpiCardProps) {
  return (
    <Card className={cn("flex-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
          {help && (
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{help}</p>
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>
          )}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold font-headline">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
