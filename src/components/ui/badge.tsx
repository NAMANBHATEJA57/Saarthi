import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pill' | 'default'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  
  const variants = {
    default: "inline-flex items-center rounded-md border border-[#e6e6e6] px-2.5 py-0.5 text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    pill: "inline-flex items-center rounded-full bg-white text-[#0075de] text-[12px] font-semibold px-2 py-1 shadow-sm"
  }

  return (
    <div className={cn(variants[variant], className)} {...props} />
  )
}

export { Badge }
