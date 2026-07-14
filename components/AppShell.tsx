"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

/**
 * Auth routes don't render the global header/navigation chrome.
 * Everything else gets the standard app layout with Header.
 */
const AUTH_ROUTES = ["/sign-in", "/register", "/forgot-password", "/"];

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() ?? "";
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-transparent">
        <SiteHeader />
        <main className="flex min-w-0 flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto flex w-full max-w-[1180px] min-w-0 flex-1 flex-col">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
