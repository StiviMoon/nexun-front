"use client";

import { ChangeEvent, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  label: string;
  name?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  isValid?: boolean;
};

const PasswordField = ({
  id,
  label,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = false,
  className,
  isValid
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((previous) => !previous);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-label={label}
          className={cn(
            "h-12 rounded-xl border-input bg-background pl-11 pr-12 text-sm transition-colors",
            value && isValid !== undefined
              ? isValid
                ? "border-emerald-500"
                : "border-destructive"
              : ""
          )}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
          aria-label={showPassword ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          onClick={handleTogglePassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default PasswordField;

