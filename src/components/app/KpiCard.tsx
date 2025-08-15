
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
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
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-base font-bold font-headline">{value}</span>
          </div>
        </div>
        {help && (
          isMobile ? (
            <Dialog>
              <DialogTrigger asChild>{helpTrigger}</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{helpTitle || label}</DialogTitle>
                  <DialogDescription as="div" className="pt-2">{help}</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>{helpTrigger}</TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">{helpContent}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </CardContent>
    </Card>
  );
}
