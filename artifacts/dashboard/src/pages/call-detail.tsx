import { useParams } from 'wouter';
import { useGetCall } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { StatusBadge } from '@/components/status-badge';
import { formatPhoneNumber, formatDuration, formatFullTimestamp } from '@/lib/format';
import { ArrowLeft, Phone, Clock, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function CallDetail() {
  const params = useParams();
  const callId = params.id ? Number(params.id) : 0;
  const { data: call, isLoading, error } = useGetCall(callId);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
            <div className="h-6 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !call) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <Phone className="w-16 h-16 mx-auto mb-4 opacity-20 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Call Not Found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The call you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/calls">
              <Button variant="outline" data-testid="button-back-to-calls">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Calls
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse transcript into turns
  const transcriptTurns: Array<{ speaker: string; text: string }> = [];
  if (call.transcript) {
    const lines = call.transcript.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      const match = line.match(/^(Caller|Agent):\s*(.+)$/i);
      if (match) {
        transcriptTurns.push({
          speaker: match[1],
          text: match[2],
        });
      }
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link href="/calls">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Calls
          </Button>
        </Link>

        {/* Metadata Header */}
        <div className="bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Call Details
              </h1>
              <StatusBadge status={call.status} />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Call ID</p>
              <p className="font-mono text-sm font-medium" data-testid="text-call-id">
                {call.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">From</p>
              </div>
              <p className="text-lg font-mono font-semibold" data-testid="text-from-number">
                {formatPhoneNumber(call.fromNumber)}
              </p>
            </div>

            {/* To */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">To</p>
              </div>
              <p className="text-lg font-mono font-semibold" data-testid="text-to-number">
                {formatPhoneNumber(call.toNumber)}
              </p>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
              </div>
              <p className="text-lg font-mono font-semibold" data-testid="text-duration">
                {formatDuration(call.durationSeconds)}
              </p>
            </div>

            {/* Started At */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Started</p>
              </div>
              <p className="text-lg font-semibold" data-testid="text-created-at">
                {formatFullTimestamp(call.createdAt)}
              </p>
            </div>
          </div>

          {call.endedAt && (
            <div className="mt-6 pt-6 border-t border-card-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Ended</p>
              </div>
              <p className="text-lg font-semibold" data-testid="text-ended-at">
                {formatFullTimestamp(call.endedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {call.summary && (
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <p className="text-sm leading-relaxed" data-testid="text-call-summary">
              {call.summary}
            </p>
          </div>
        )}

        {/* Transcript */}
        {transcriptTurns.length > 0 ? (
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Transcript</h2>
            <div className="space-y-4" data-testid="transcript-container">
              {transcriptTurns.map((turn, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    turn.speaker.toLowerCase() === 'agent'
                      ? 'flex-row-reverse'
                      : ''
                  }`}
                  data-testid={`transcript-turn-${index}`}
                >
                  <div
                    className={`flex-shrink-0 w-16 text-xs font-semibold uppercase tracking-wide ${
                      turn.speaker.toLowerCase() === 'agent'
                        ? 'text-primary text-right'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {turn.speaker}
                  </div>
                  <div
                    className={`flex-1 rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      turn.speaker.toLowerCase() === 'agent'
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : call.transcript ? (
          <div className="bg-card border border-card-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Transcript</h2>
            <pre
              className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
              data-testid="text-transcript-raw"
            >
              {call.transcript}
            </pre>
          </div>
        ) : null}

        {/* No transcript message */}
        {!call.transcript && (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground" data-testid="text-no-transcript">
              No transcript available for this call
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
