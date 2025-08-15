
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  help?: string;
  helpTitle?: string;
  className?: string;
}

export function KpiCard({ label, value, icon, help, helpTitle, className }: KpiCardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const helpTrigger = (
    <div className="text-muted-foreground cursor-help">
      <HelpCircle className="h-3.5 w-3.5" />
    </div>
  );

  const helpContent = (
      <div className="space-y-1 text-left">
          <p className="font-semibold">{helpTitle || label}</p>
          <p className="text-muted-foreground text-xs">{help}</p>
      </div>
  );

  return (
    <Card className={cn("flex-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {label}
        </CardTitle>
        <div className="flex items-center gap-2">
            {help && (
                isMobile ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      {helpTrigger}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{helpTitle || label}</DialogTitle>
                        <DialogDescription as="div" className="pt-2">
                          {help}
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                          {helpTrigger}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3">
                          {helpContent}
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
                )
            )}
            {icon}
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="text-xl font-bold font-headline">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
