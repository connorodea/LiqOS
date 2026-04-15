import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LiqOSSidebar } from "@/components/liqos/sidebar";
import { LiqOSTopbar } from "@/components/liqos/topbar";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LiqOS | Liquidation Operating System",
    template: "%s | LiqOS",
  },
  description:
    "Liquidation Operating System — Receiving, Testing, Lot Building, Listings, Shipping, and Analytics.",
  robots: { index: false, follow: false },
};

export default function LiqOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen antialiased bg-background text-foreground">
        <div className="flex min-h-screen">
          <LiqOSSidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <LiqOSTopbar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
