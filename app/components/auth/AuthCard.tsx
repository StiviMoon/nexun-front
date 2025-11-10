"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

const BrandBadge = () => (
  <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-xl font-bold text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900">
    N
  </div>
);

const AuthCard = ({ title, description, children, className }: AuthCardProps) => {
  return (
    <Card className={cn("border-border/60 bg-background/95 shadow-xl backdrop-blur", className)}>
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

