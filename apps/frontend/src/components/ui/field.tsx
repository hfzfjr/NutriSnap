import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      error,
      helperText,
      required,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={htmlFor} className="text-xs">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
          </div>
        )}
        {children}
        {error ? (
          <p className="text-[11px] font-medium text-destructive">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Field.displayName = "Field";

