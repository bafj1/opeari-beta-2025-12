import * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={`rounded-xl border bg-card text-card-foreground shadow ${className || ""}`}
            {...props}
        />
    )
)
Card.displayName = "Card"
