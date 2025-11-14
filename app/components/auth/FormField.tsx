"use client";

import { ChangeEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  type?: string;
  name?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
};

const FormField = ({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  icon,
  className,
  ariaLabel
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-label={ariaLabel || label}
          className={cn(
            "h-12 rounded-xl border-input bg-background text-sm transition-colors",
            icon ? "pl-11" : "pl-4",
            className
          )}
        />
      </div>
    </div>
  );
};

export default FormField;

