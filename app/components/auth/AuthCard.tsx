/**
 * ===========================================
 * AUTH CARD COMPONENT
 * ===========================================
 *
 * A reusable card component for authentication-related pages, such as
 * login, registration, or password recovery forms. Provides a consistent
 * layout, branding, and styling for authentication interfaces.
 *
 * Main responsibilities:
 * - Display a brand logo badge at the top.
 * - Show a title and description.
 * - Render child content (e.g., forms, buttons) inside the card.
 * - Support custom styling via the `className` prop.
 *
 * Props:
 * typedef {Object} AuthCardProps
 * property {string} title - The main heading/title of the card.
 * property {string} description - A descriptive text displayed below the title.
 * property {ReactNode} children - Content to render inside the card, typically a form or buttons.
 * property {string} [className] - Optional additional classes for customizing card styles.
 *
 * BrandBadge:
 * - Renders the Nexun logo as a centered, rounded badge at the top of the card.
 * - Uses Next.js Image component with priority loading for better performance.
 *
 * Usage Notes:
 * - Designed for authentication pages to maintain consistent UI/UX.
 * - Supports responsive layouts and modern styling with backdrop blur and shadow.
 */

"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

const BrandBadge = () => (
  <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl">
    <Image
      src="/logo.svg"
      alt="Nexun Logo"
      width={80}
      height={80}
      className="h-20 w-20"
      priority
    />
  </div>
);

const AuthCard = ({ title, description, children, className }: AuthCardProps) => {
  return (
    <Card
      className={cn(
        "w-full border-border/60 bg-background/95 shadow-xl backdrop-blur transition-shadow",
        className
      )}
    >
      <CardHeader className="space-y-3 text-center">
        <BrandBadge />
        <CardTitle className="text-3xl font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
};

export default AuthCard;
