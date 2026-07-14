import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-transparent flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
