"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import AsideNavbar from "./NavBar/Navbar";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className = "" }) => {
  const router = useRouter();
  const { currentUser, isAuthInitializing } = useAuthWithQuery();

  useEffect(() => {
    if (!isAuthInitializing && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthInitializing, router]);

  // Loading state
  if (isAuthInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
          Cargando...
        </div>
      </div>
    );
  }

  // No user logged in
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Aside Navigation */}
      <AsideNavbar />

      {/* Main Content */}
      <main className={`flex-1 overflow-auto pt-16 lg:pt-0 ${className}`}>
        {children}
      </main>
    </div>
  );
};

