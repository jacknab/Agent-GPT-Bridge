export function formatPhoneNumber(phone: string): string {
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Format as +X (XXX) XXX-XXXX for 11 digits
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return as-is if format doesn't match
  return phone;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '0s';
  
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return remainingMins > 0
    ? `${hours}h ${remainingMins}m`
    : `${hours}h`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  // Less than 1 hour: show "X min ago"
  if (diffMins < 60) {
    return diffMins <= 0 ? 'just now' : `${diffMins}m ago`;
  }
  
  // Less than 24 hours: show "X hr ago"
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  // Same year: show "MMM D, h:mm a"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  // Different year: show "MMM D, YYYY"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFullTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
