import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Flame } from "lucide-react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutriSnap — AI Nutrition, Bulking & Diet Tracker PWA",
  description:
    "AI-powered food photo logging, BMI/TDEE calculator, and bulking/diet coach powered by Google Gemini BYOK.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriSnap",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col md:flex-row">
            <DesktopSidebar />

            {/* Mobile Sticky Top Header (<768px) */}
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Flame className="h-4 w-4" />
                </div>
                <span className="text-base font-bold tracking-tight">NutriSnap</span>
              </div>
              <ThemeToggle />
            </header>

            <main className="flex-1 md:pl-64 pb-24 md:pb-8">
              <div className="mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-6">
                {children}
              </div>
            </main>

            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

