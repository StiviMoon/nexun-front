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

