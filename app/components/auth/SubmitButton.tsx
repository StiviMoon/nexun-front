"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
};

const SubmitButton = ({ label, isLoading = false, disabled = false, className }: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={disabled}
      aria-disabled={disabled}
      aria-busy={isLoading}
      aria-label={label}
      className={cn(
        "btn-shine h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/60 hover:scale-105",
        className
      )}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      ) : (
        <>
          <span className="relative z-10">{label}</span>
          <ArrowRight className="relative z-10 h-4 w-4" aria-hidden="true" />
        </>
      )}
    </Button>
  );
};

export default SubmitButton;

