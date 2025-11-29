import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthStatusModal from "@/app/components/AuthStatusModal";
import { ReactQueryProvider } from "@/lib/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexun",
  description: "Nexun",
};

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
        <ReactQueryProvider>
          {children}
          <AuthStatusModal />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
