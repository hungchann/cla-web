"use client"

import { Suspense } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type SidebarSubmenuGroup = {
  title: string
  icon: LucideIcon
  defaultOpen?: boolean
  items: {
    title: string
    url: string
  }[]
}

function NavMainContent({
  label,
  items,
}: Readonly<{
  label: string
  items: SidebarSubmenuGroup[]
}>) {
  const pathname = usePathname() ?? ""
  const searchParams = useSearchParams()
  const currentQuery = searchParams.toString()

  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500/80">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.defaultOpen ?? true}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className="h-10 rounded-xl px-3 text-sm font-bold text-sidebar-foreground/80 dark:text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent/50 data-[state=open]:text-sidebar-accent-foreground data-[state=open]:[&>svg:last-child]:rotate-90"
                >
                  <item.icon className="size-4 text-zinc-500 transition-colors group-hover/menu-button:text-sidebar-accent-foreground group-data-[state=open]/menu-item:text-sidebar-accent-foreground" />
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto size-4 transition-transform duration-200" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="ml-5 mr-2 mt-1 border-l border-sidebar-border/60 pl-3">
                  {item.items.map((subItem) => {
                    const link = new URL(subItem.url, "http://local")
                    const isActive =
                      !link.hash &&
                      link.pathname === pathname &&
                      link.searchParams.toString() === currentQuery

                    return (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive}
                          className="h-8 rounded-lg px-2 text-xs font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                        >
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/**
 * The app sidebar deliberately contains only controls for the current route.
 * Global navigation lives in SiteHeader so changing sections never turns this
 * into a second navigator.
 */
export function NavMain({
  label,
  items,
}: Readonly<{
  label: string
  items: SidebarSubmenuGroup[]
}>) {
  return (
    <Suspense
      fallback={
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500/80">
            {label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className="h-10 rounded-xl px-3 text-sm font-bold text-sidebar-foreground/80 dark:text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <item.icon className="size-4 text-zinc-500" />
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto size-4 transition-transform duration-200" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <NavMainContent label={label} items={items} />
    </Suspense>
  )
}
