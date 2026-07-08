import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FolderX } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon = <FolderX className="h-12 w-12 text-muted-foreground/50" />, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center animate-in fade-in-50", className)}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary border border-border">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-bold uppercase tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto font-medium">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
