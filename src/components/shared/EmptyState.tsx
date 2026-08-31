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
        "flex flex-col items-center justify-center text-center w-full rounded-[var(--radius)] border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]/50",
        compact ? "p-6" : "p-12 min-h-[250px]",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(var(--surface-elevated))] mb-4 text-[hsl(var(--ink-secondary))] shadow-sm ring-1 ring-[hsl(var(--hairline))]">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-[hsl(var(--ink))] mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-[hsl(var(--ink-muted))] max-w-[280px] mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
