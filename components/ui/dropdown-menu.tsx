"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
} | null>(null)

export function DropdownMenu({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [open])

  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open])

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("useDropdownMenu must be used within a DropdownMenu")
  }
  return context
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenu()
  
  const handleRef = (node: HTMLButtonElement) => {
    // @ts-ignore
    triggerRef.current = node
    if (ref) {
      if (typeof ref === "function") ref(node)
      else ref.current = node
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: handleRef,
      onClick: handleClick,
      "aria-expanded": open,
    })
  }

  return (
    <button
      ref={handleRef}
      type="button"
      onClick={handleClick}
      className={className}
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = useDropdownMenu()

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-zinc-150 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-hidden z-50 dark:bg-zinc-900 dark:border-zinc-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { setOpen } = useDropdownMenu()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false)
    props.onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn(
        "flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors select-none outline-hidden dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 cursor-pointer",
        className
      ),
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        setOpen(false)
        const childClick = (children.props as any).onClick
        if (childClick) childClick(e)
      }
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors select-none outline-hidden dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 cursor-pointer text-left",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-3 py-2 text-xs font-bold text-zinc-400 select-none", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1.5 h-px bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"
