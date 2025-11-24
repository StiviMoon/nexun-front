/**
 * ===========================================
 * AUTH LINK COMPONENT
 * ===========================================
 *
 * A text component used in authentication pages that provides a
 * sentence with a clickable link, commonly used for navigation
 * between login, registration, or password recovery pages.
 *
 * Main responsibilities:
 * - Display informational text with an inline link.
 * - Style the link to visually stand out and respond to hover interactions.
 * - Support custom styling through a `className` prop.
 *
 * Props:
 * typedef {Object} AuthLinkProps
 * property {string} href - The URL path the link navigates to.
 * property {string} text - The static text displayed before the link.
 * property {string} linkText - The clickable portion of the text.
 * property {string} [className] - Optional additional classes for styling the paragraph.
 *
 * Usage Notes:
 * - Designed to be used in authentication forms, e.g., "Don't have an account? Sign up".
 * - Combines `Link` from Next.js for client-side navigation with consistent styling.
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthLinkProps = {
  href: string;
  text: string;
  linkText: string;
  className?: string;
};

const AuthLink = ({ href, text, linkText, className }: AuthLinkProps) => {
  return (
    <p className={cn("w-full text-center text-sm text-muted-foreground", className)}>
      {text}{" "}
      <Link
        className="font-medium text-white underline-offset-4 transition-colors hover:underline"
        href={href}
      >
        {linkText}
      </Link>
    </p>
  );
};

export default AuthLink;
