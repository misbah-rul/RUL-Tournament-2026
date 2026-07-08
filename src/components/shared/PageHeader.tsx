import { ReactNode } from "react";
import { Container } from "../layout/Container";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  subTitle?: string;
}

export function PageHeader({ title, description, children, className, subTitle = "Tournament Hub" }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border bg-secondary/20 py-8 md:py-12 relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 to-transparent opacity-50"></div>
      <Container className="relative z-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">{subTitle}</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-3">
              {title.split(' ').map((word, i, arr) => 
                i === arr.length - 1 && arr.length > 1 ? (
                  <span key={i} className="text-muted-foreground font-light not-italic"> {word}</span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </h1>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-medium">{description}</p>
            )}
          </div>
          {children && <div>{children}</div>}
        </div>
      </Container>
    </div>
  );
}
