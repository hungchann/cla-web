import * as React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps extends React.ComponentProps<"div"> {
  maxWidth?: "default" | "narrow" | "full"
}

export function PageContainer({
  className,
  maxWidth = "default",
  children,
  ...props
}: Readonly<PageContainerProps>) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col gap-9 px-4 py-7 sm:px-6 lg:px-8 lg:py-9",
        maxWidth === "default" && "mx-auto max-w-[1180px]",
        maxWidth === "narrow" && "mx-auto max-w-3xl pb-20",
        maxWidth === "full" && "max-w-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
