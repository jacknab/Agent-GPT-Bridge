import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/[_-]/g, ' ');

  const variants: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'in progress': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    initiated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
    busy: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'no answer': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  const variant = variants[normalized] || variants['no answer'];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border',
        variant,
        className
      )}
      data-testid={`badge-status-${normalized.replace(/\s+/g, '-')}`}
    >
      {normalized}
    </span>
  );
}
