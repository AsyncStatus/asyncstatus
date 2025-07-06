import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed p-4 sm:p-8 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="mb-2 text-base sm:text-lg font-medium">{title}</h3>
      {description && <p className="text-muted-foreground mb-4 text-sm max-w-sm">{description}</p>}
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
