import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-amber-500 text-white shadow-xs hover:bg-amber-600",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
        destructive:
          "border-transparent bg-red-500 text-white shadow-xs hover:bg-red-600",
        outline: "text-zinc-750 dark:text-zinc-350 border-zinc-200 dark:border-zinc-800 bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
