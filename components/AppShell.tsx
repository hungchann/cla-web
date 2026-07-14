"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

/**
 * Auth routes don't render the global header/navigation chrome.
 * Everything else gets the standard app layout with Header.
 */
// Which top-level routes should use the global AppShell (header + sidebar).
// Only pages under these prefixes will render the global chrome. Other
// routes (landing, auth pages, marketing) render their own layout.
const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/courses",
  "/bilingual",
  "/stories",
  "/speaking",
  "/flashcard",
  "/grammar",
  "/video",
];

// Explicit auth routes that should not use the app chrome.
const AUTH_ROUTES = ["/sign-in", "/register", "/forgot-password"];

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() ?? "";

  // If this is an explicit auth route, or not one of the app prefixes,
  // don't render the global AppShell (landing/marketing pages manage their
  // own header/footer).
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isAppRoute = APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

  if (isAuthRoute || !isAppRoute) {
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
