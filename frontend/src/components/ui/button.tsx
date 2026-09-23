import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'utility' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'utility', ...props }, ref) => {
    
    // Premium micro-interactions: smooth transitions, focus rings, tactile scale
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] disabled:opacity-50 disabled:pointer-events-none"
    
    const variants = {
      primary: "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-active))] rounded-full px-6 py-2 text-[16px] shadow-sm",
      secondary: "bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--ink-muted))] border border-[hsl(var(--hairline))] rounded-full px-6 py-2 text-[16px] shadow-[rgba(0,0,0,0.2)_0_1px_3px]",
      utility: "bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--surface-elevated))] hover:text-[hsl(var(--ink))] rounded-[8px] px-[14px] py-[4px] text-[16px] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--ink-muted))]",
      icon: "bg-transparent text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface-elevated))] hover:text-[hsl(var(--ink))] rounded-full h-10 w-10 active:scale-90 transition-all duration-200"
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
