"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

const AuthShell = ({ children, className }: AuthShellProps) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8 dark:bg-background",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20" />
      <div className="relative z-10 w-full max-w-3xl mx-auto">{children}</div>
    </div>
  );
};

export default AuthShell;

