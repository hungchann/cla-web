import AppShell from "@/components/AppShell";
import QueryProvider from "@/app/query-provider";
import AIConsentProvider from "@/components/AIConsentProvider";

export default function AppGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <QueryProvider>
            <AIConsentProvider>
                <AppShell>{children}</AppShell>
            </AIConsentProvider>
        </QueryProvider>
    );
}
