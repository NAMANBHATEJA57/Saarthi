import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius)] border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] px-3 py-1 text-[14px] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-medium file:text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
