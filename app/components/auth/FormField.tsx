/**
 * ===========================================
 * FORM FIELD COMPONENT
 * ===========================================
 *
 * A reusable input field component for forms.
 * It combines a label, input, and optional icon for consistent styling.
 *
 * Main responsibilities:
 * - Display a label for the input field.
 * - Render an input element with type, value, placeholder, and other props.
 * - Optionally render an icon inside the input field.
 * - Support accessibility with proper aria-labels.
 * - Allow additional styling via the `className` prop.
 *
 * Props:
 * typedef {Object} FormFieldProps
 * property {string} id - Unique identifier for the input field.
 * property {string} label - Label text displayed above the input.
 * property {string} [type='text'] - HTML input type (text, password, email, etc.).
 * property {string} [name] - Name attribute of the input element.
 * property {string} value - Current value of the input.
 * property {(event: ChangeEvent<HTMLInputElement>) => void} onChange - Change event handler.
 * property {string} [placeholder] - Placeholder text displayed inside the input.
 * property {string} [autoComplete] - Browser autocomplete attribute.
 * property {boolean} [required=false] - Marks the field as required.
 * property {ReactNode} [icon] - Optional icon displayed inside the input.
 * property {string} [className] - Additional CSS classes for customization.
 * property {string} [ariaLabel] - ARIA label for accessibility; defaults to the label.
 * property {string | number} [min] - Minimum value for numeric inputs.
 * property {(event: React.KeyboardEvent<HTMLInputElement>) => void} [onKeyDown] - Optional keyboard event handler.
 *
 * Usage Notes:
 * - Typically used in authentication or general form pages.
 * - Integrates with Input and Label UI components for consistent design.
 */

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
  min?: string | number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
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
  ariaLabel,
  min,
  onKeyDown
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
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-label={ariaLabel || label}
          min={min}
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
