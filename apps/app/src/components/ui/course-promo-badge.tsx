"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CoursePromoBadgeProps {
  sidebarOpen?: boolean;
}

export function CoursePromoBadge({ sidebarOpen = true }: CoursePromoBadgeProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  // Collapsed state - show only icon with tooltip
  if (!sidebarOpen) {
    return (
      <div className="p-2 pb-0 flex justify-center">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://agenticjumpstart.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all border border-primary/30"
                data-testid="course-promo-badge-collapsed"
              >
                <Sparkles className="size-4 shrink-0" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>Become a 10x Dev</span>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDismissed(true);
                }}
                className="p-0.5 rounded-full hover:bg-primary/30 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X className="size-3" />
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Expanded state - show full badge
  return (
    <div className="p-2 pb-0">
      <a
        href="https://agenticjumpstart.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group cursor-pointer flex items-center justify-between w-full px-2 lg:px-3 py-2.5 bg-primary/10 text-primary rounded-lg font-medium text-sm hover:bg-primary/20 transition-all border border-primary/30"
        data-testid="course-promo-badge"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0" />
          <span className="hidden lg:block">Become a 10x Dev</span>
        </div>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDismissed(true);
          }}
          className="hidden lg:block p-1 rounded-full hover:bg-primary/30 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </span>
      </a>
    </div>
  );
}
