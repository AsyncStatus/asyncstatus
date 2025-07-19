import { cn } from "@asyncstatus/ui/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  className?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:py-16 sm:px-4 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="mb-1 text-base sm:text-lg font-medium">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 text-sm max-w-sm text-pretty">{description}</p>
      )}
      {children && <div className="w-full sm:w-auto">{children}</div>}
    </div>
  );
}
