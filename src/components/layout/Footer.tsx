import { Container } from "./Container";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="h-12 border-t border-border/50 bg-background text-[10px] text-muted-foreground font-bold uppercase tracking-widest shrink-0">
      <Container className="h-full">
        <div className="flex h-full items-center justify-between">
          <div>© {currentYear} RISEUP LABS &bull; WORLD CUP EDITION</div>
          <div className="flex gap-6">
            <span className="hidden sm:inline">Privacy Policy</span>
            <span className="hidden sm:inline">Support Center</span>
            <span className="text-primary/50">System v2.4.1</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
