"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

/**
 * Auth routes don't render the global header/navigation chrome.
 * Everything else gets the standard app layout with Header.
 */
const AUTH_ROUTES = ["/sign-in", "/register", "/forgot-password"];

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname() ?? "";
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
