import type { SSEEvent } from '../../types';

interface ProgressFeedProps {
  events: SSEEvent[];
}

export default function ProgressFeed({ events }: ProgressFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {events.map((event, i) => (
        <FeedRow key={i} event={event} isLast={i === events.length - 1} />
      ))}
    </div>
  );
}

function FeedRow({ event, isLast }: { event: SSEEvent; isLast: boolean }) {
  const icon =
    event.type === 'completed' ? (
      <CheckIcon />
    ) : event.type === 'error' ? (
      <ErrorIcon />
    ) : isLast ? (
      <SpinnerIcon />
    ) : (
      <DoneIcon />
    );

  const textColor =
    event.type === 'completed'
      ? 'text-green-400'
      : event.type === 'error'
      ? 'text-red-400'
      : isLast
      ? 'text-council-300'
      : 'text-gray-400';

  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-start gap-2.5 animate-fade-in">
      <span className={`mt-0.5 flex-shrink-0 ${textColor}`}>{icon}</span>
      <span className={`text-sm leading-snug ${textColor}`}>{event.message}</span>
      <span className="ml-auto flex-shrink-0 text-xs text-gray-700 font-mono">{time}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" opacity="0.5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}
