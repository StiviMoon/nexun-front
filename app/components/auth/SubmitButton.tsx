/**
 * ===========================================
 * SUBMIT BUTTON COMPONENT
 * ===========================================
 *
 * A reusable submit button component for forms.
 * Handles loading and disabled states and includes a right-arrow icon.
 *
 * Props:
 * typedef {Object} SubmitButtonProps
 * property {string} label - The text displayed on the button.
 * property {boolean} [isLoading=false] - Whether the button shows a loading spinner.
 * property {boolean} [disabled=false] - Whether the button is disabled.
 * property {string} [className] - Additional CSS classes for custom styling.
 *
 * Accessibility:
 * - Uses `aria-label` to describe the button's action.
 * - Uses `aria-disabled` and `aria-busy` to indicate state.
 *
 * Usage:
 * ```tsx
 * <SubmitButton
 *   label="Sign In"
 *   isLoading={isSubmitting}
 *   disabled={!isFormValid}
 * />
 * ```
 */
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
