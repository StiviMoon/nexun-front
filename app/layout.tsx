import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthStatusModal from "@/app/components/AuthStatusModal";
import { ReactQueryProvider } from "@/lib/react-query";

/**
 * Import and configure Geist Sans font
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Import and configure Geist Mono font
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata for the Next.js application
 */
export const metadata: Metadata = {
  title: "Nexun",
  description: "Nexun",
};

/**
 * RootLayout component wraps the entire application and provides
 * global styles, fonts, and context providers.
 *
 * param {Readonly<{ children: React.ReactNode }>} props - Component props
 * param {React.ReactNode} props.children - The child components to render
 * returns {JSX.Element} The root layout element
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* React Query Provider wraps the app to provide query caching and state management */}
        <ReactQueryProvider>
          {children}
          {/* Modal that shows user authentication status */}
          <AuthStatusModal />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
