"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS, type PasswordRequirement } from "@/types/forms";

type PasswordStrengthIndicatorProps = {
  password: string;
  className?: string;
};

const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  if (!password) {
    return null;
  }

  const requirements = PASSWORD_REQUIREMENTS.map((requirement: PasswordRequirement) => ({
    ...requirement,
    met: requirement.regex.test(password)
  }));

  return (
    <div className={cn("space-y-1 rounded-lg border border-input bg-muted/30 p-3 text-xs", className)}>
      {requirements.map((requirement) => (
        <div className="flex items-center gap-2" key={requirement.text}>
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
              requirement.met ? "bg-emerald-500 text-emerald-100" : "bg-border text-muted-foreground"
            )}
          >
            {requirement.met ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
          </span>
          <span
            className={cn(
              "transition-colors",
              requirement.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            {requirement.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PasswordStrengthIndicator;

