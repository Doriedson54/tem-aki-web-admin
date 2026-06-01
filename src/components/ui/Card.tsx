import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-radius-xl border border-border-default bg-surface-card text-text-primary shadow-card hover:shadow-card-hover transition-shadow p-space-6",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export { Card }
