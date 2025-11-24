/**
 * ===========================================
 * ERROR ALERT COMPONENT
 * ===========================================
 *
 * A reusable alert component for displaying error messages in forms or UI.
 * It uses a destructive variant styling to clearly indicate an error state.
 *
 * Main responsibilities:
 * - Show an error icon (AlertCircle) alongside the message.
 * - Conditionally render only when a message is provided.
 * - Allow custom styling via the `className` prop.
 *
 * Props:
 * typedef {Object} ErrorAlertProps
 * property {string | null | undefined} message - The error message to display. If null or undefined, the alert is not rendered.
 * property {string} [className] - Optional additional classes for custom styling.
 *
 * Usage Notes:
 * - Typically used in forms to display validation errors or server errors.
 * - Integrates with other UI components like Alert and AlertDescription for consistent styling.
 */

"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ErrorAlertProps = {
  message: string | null | undefined;
  className?: string;
};

const ErrorAlert = ({ message, className }: ErrorAlertProps) => {
  if (!message) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className={cn(
        "rounded-xl border border-destructive/40 bg-destructive/10",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <AlertDescription className="text-sm text-destructive/90">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
