import { Link, useRoute } from 'wouter';
import { Phone, BarChart3, Settings } from 'lucide-react';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isDashboard] = useRoute('/');
  const [isCalls] = useRoute('/calls');
  const [isCallDetail] = useRoute('/calls/:id');
  const [isConfig] = useRoute('/config');

  const isCallsActive = isCalls || isCallDetail;

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
            Night Watch
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Call Monitoring
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-none ${
              isDashboard
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            data-testid="link-dashboard"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/calls"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-none ${
              isCallsActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            data-testid="link-calls"
          >
            <Phone className="w-4 h-4" />
            Call History
          </Link>
          <Link
            href="/config"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-none ${
              isConfig
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            data-testid="link-config"
          >
            <Settings className="w-4 h-4" />
            Agent Config
          </Link>
        </nav>

        <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground font-mono">
          v1.0.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
