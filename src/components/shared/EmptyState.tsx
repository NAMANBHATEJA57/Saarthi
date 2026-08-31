"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center w-full rounded-xl border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))]",
        compact ? "p-6" : "p-12 min-h-[300px]",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(var(--surface))] mb-4 text-[hsl(var(--ink-secondary))] shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[hsl(var(--ink))] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[hsl(var(--ink-secondary))] max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
