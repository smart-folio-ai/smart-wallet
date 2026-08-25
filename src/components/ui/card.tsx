import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * `variant="glass"` é o cartão do redesign de dashboard (TRA — ver
 * PRODUCT.md e docs/superpowers do redesign): gradiente translúcido +
 * borda hairline + blur, o mesmo vocabulário visual já usado na landing
 * (`web/src/components/landing/ui/GlassPanel.tsx`). Nunca sombra colorida.
 *
 * O default ("surface") é o `Card` de sempre, inalterado — trocar a
 * variante em uma página não afeta nenhuma das outras 70+ que usam
 * `<Card>` sem passar `variant`.
 */
const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      surface:
        "border border-border/80 bg-card text-card-foreground shadow-sm",
      glass:
        "rounded-2xl border border-surface-hairline/[0.12] bg-gradient-to-b from-surface-hairline/[0.05] to-surface-hairline/[0.01] text-card-foreground backdrop-blur-xl",
    },
  },
  defaultVariants: {
    variant: "surface",
  },
})

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant }), className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
