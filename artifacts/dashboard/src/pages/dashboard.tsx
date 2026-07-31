import { useGetCallStats, useListCalls } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { StatusBadge } from '@/components/status-badge';
import { formatPhoneNumber, formatDuration, formatTimestamp } from '@/lib/format';
import { Link } from 'wouter';
import { Phone, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetCallStats();
  const { data: recentCalls, isLoading: callsLoading } = useListCalls({ limit: 10 });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of overnight call activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Calls */}
          <div className="bg-card border border-card-border rounded-lg p-5" data-testid="card-total-calls">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                {statsLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-2 font-mono" data-testid="text-total-calls">
                    {stats?.totalCalls ?? 0}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Calls Today */}
          <div className="bg-card border border-card-border rounded-lg p-5" data-testid="card-calls-today">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calls Today</p>
                {statsLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-2 font-mono" data-testid="text-calls-today">
                    {stats?.callsToday ?? 0}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </div>
          </div>

          {/* Average Duration */}
          <div className="bg-card border border-card-border rounded-lg p-5" data-testid="card-avg-duration">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                {statsLoading ? (
                  <div className="h-9 w-24 bg-muted animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-2 font-mono" data-testid="text-avg-duration">
                    {formatDuration(stats?.averageDurationSeconds)}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-chart-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="bg-card border border-card-border rounded-lg">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="text-lg font-semibold">Recent Calls</h2>
          </div>
          
          {callsLoading ? (
            <div className="divide-y divide-card-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : !recentCalls || recentCalls.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground" data-testid="text-no-calls">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No calls recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/calls/${call.id}`}
                  className="block px-5 py-4 hover:bg-muted/50 transition-none"
                  data-testid={`link-call-${call.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <StatusBadge status={call.status} />
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(call.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium font-mono" data-testid={`text-from-${call.id}`}>
                        {formatPhoneNumber(call.fromNumber)}
                      </p>
                      {call.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1" data-testid={`text-summary-${call.id}`}>
                          {call.summary}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono text-muted-foreground">
                        {formatDuration(call.durationSeconds)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {recentCalls && recentCalls.length > 0 && (
            <div className="px-5 py-3 border-t border-card-border">
              <Link
                href="/calls"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-none"
                data-testid="link-view-all"
              >
                View all calls →
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
