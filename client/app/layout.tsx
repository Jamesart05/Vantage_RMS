import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/Toast";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["500", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "BusinessOS — Business Operating System for African SMEs",
  description: "AI-powered business operating system for African SMEs — sales, inventory, employees and more in one place.",
};

// Only the (app) route group renders the sidebar/topbar shell — sign-in,
// sign-up, and onboarding pages live outside it with their own minimal layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
