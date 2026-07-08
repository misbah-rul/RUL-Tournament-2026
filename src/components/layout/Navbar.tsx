import { Container } from "./Container";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20 italic">R</div>
            <span className="text-lg font-bold tracking-tight uppercase italic">
              Riseup Labs <span className="text-primary">2026</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground h-full">
            <Link 
              to="/" 
              className={`flex items-center h-full transition-colors hover:text-foreground ${isActive("/") ? "text-foreground border-b-2 border-primary" : ""}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/fixtures" 
              className={`flex items-center h-full transition-colors hover:text-foreground ${isActive("/fixtures") ? "text-foreground border-b-2 border-primary" : ""}`}
            >
              Fixtures
            </Link>
            <Link 
              to="/results" 
              className={`flex items-center h-full transition-colors hover:text-foreground ${isActive("/results") ? "text-foreground border-b-2 border-primary" : ""}`}
            >
              Results
            </Link>
            <Link 
              to="/standings" 
              className={`flex items-center h-full transition-colors hover:text-foreground ${isActive("/standings") ? "text-foreground border-b-2 border-primary" : ""}`}
            >
              Standings
            </Link>
            <Link 
              to="/rules" 
              className={`flex items-center h-full transition-colors hover:text-foreground ${isActive("/rules") ? "text-foreground border-b-2 border-primary" : ""}`}
            >
              Rules
            </Link>
          </nav>

          {/* Right side intentionally empty — admin panel is accessed directly via /admin */}
          <div className="flex items-center gap-4" />
        </div>
      </Container>
    </header>
  );
}
