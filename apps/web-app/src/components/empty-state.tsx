import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
