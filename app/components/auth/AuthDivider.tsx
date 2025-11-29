"use client";

import { Separator } from "@/components/ui/separator";

type AuthDividerProps = {
  text?: string;
};

const AuthDivider = ({ text = "O continúa con" }: AuthDividerProps) => {
  return (
    <div className="relative">
      <Separator className="bg-border" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs font-medium text-muted-foreground">
        {text}
      </span>
    </div>
  );
};

export default AuthDivider;

