/**
 * ===========================================
 * AUTH SHELL COMPONENT
 * ===========================================
 *
 * A layout wrapper component for authentication pages, providing
 * consistent background, centering, and styling for child elements.
 *
 * Main responsibilities:
 * - Center authentication content both vertically and horizontally.
 * - Provide a subtle background overlay with grid pattern and opacity.
 * - Allow custom styling through the `className` prop.
 *
 * Props:
 * typedef {Object} AuthShellProps
 * property {ReactNode} children - The content to render inside the shell (e.g., forms, cards).
 * property {string} [className] - Optional additional classes for custom styling.
 *
 * Usage Notes:
 * - Typically used as the top-level wrapper for login, signup, or password recovery pages.
 * - Ensures a consistent look and feel across all authentication-related pages.
 */

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
