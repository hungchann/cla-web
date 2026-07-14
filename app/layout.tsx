import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./query-provider";
import AIConsentProvider from "@/components/AIConsentProvider";
// AppShell is moved to the (app) route group. Root layout keeps landing/auth layouts.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CLA - Chinese Learning App",
  description: "Học tiếng Trung hiệu quả thông qua bài đọc song ngữ, flashcards và video phụ đề.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/** Root layout: landing and auth pages render directly here. The main app chrome
            is provided by `app/(app)/layout.tsx` which wraps its children with `AppShell`. */}
        <QueryProvider>
          <AIConsentProvider>{children}</AIConsentProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
