import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "strong" | "ghost"
    size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-radius-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-action-primary text-text-on-brand shadow-button-primary hover:bg-action-primary-hover active:bg-action-primary-active":
                            variant === "primary",
                        "bg-surface-card text-text-primary border border-border-default hover:bg-surface-subtle":
                            variant === "secondary",
                        "bg-action-strong text-text-on-brand shadow-lg hover:bg-action-strong-hover":
                            variant === "strong",
                        "hover:bg-surface-subtle text-text-primary": variant === "ghost",
                        "h-8 px-3 text-text-xs": size === "sm",
                        "h-10 px-4 py-2 text-text-base": size === "md",
                        "h-12 px-8 text-text-lg": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
