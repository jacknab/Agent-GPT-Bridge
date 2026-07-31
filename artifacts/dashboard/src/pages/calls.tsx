import { useState } from 'react';
import { useListCalls } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { StatusBadge } from '@/components/status-badge';
import { formatPhoneNumber, formatDuration, formatTimestamp } from '@/lib/format';
import { Link } from 'wouter';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_FILTERS = [
  'all',
  'completed',
  'in-progress',
  'initiated',
  'failed',
  'busy',
  'no-answer',
] as const;

export default function Calls() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { data: calls, isLoading } = useListCalls();

  const filteredCalls =
    activeFilter === 'all'
      ? calls
      : calls?.filter(
          (call) =>
            call.status.toLowerCase().replace(/[_\s]/g, '-') === activeFilter
        );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete log of all incoming calls
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2" data-testid="filter-bar">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="font-mono text-xs capitalize transition-none"
              data-testid={`button-filter-${filter}`}
            >
              {filter.replace(/-/g, ' ')}
            </Button>
          ))}
        </div>

        {/* Calls Table */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : !filteredCalls || filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Phone className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground" data-testid="text-no-results">
                        {activeFilter === 'all'
                          ? 'No calls recorded yet'
                          : `No ${activeFilter.replace(/-/g, ' ')} calls`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      className="hover:bg-muted/30 transition-none"
                      data-testid={`row-call-${call.id}`}
                    >
                      <td className="px-4 py-3">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/calls/${call.id}`}
                          className="font-mono text-sm hover:text-primary transition-none"
                          data-testid={`link-call-${call.id}`}
                        >
                          {formatPhoneNumber(call.fromNumber)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatPhoneNumber(call.toNumber)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatDuration(call.durationSeconds)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(call.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
