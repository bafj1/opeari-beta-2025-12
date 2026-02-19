import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        // Basic variant/size mapping
        let baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

        // Variant styles (simplified for what's needed, relying on Tailwind classes passed in className to override mostly)
        // The user's code relies heavily on className overrides, so we just need base + structure.

        return (
            <button
                className={`${baseStyles} ${className || ""}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"
