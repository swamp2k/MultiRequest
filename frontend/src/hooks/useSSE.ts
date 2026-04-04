import { useEffect, useRef, useState } from 'react';
import type { SSEEvent, SSEEventType, WorkflowResult, QueryStatus } from '../types';
import { parseWorkflowResult } from '../lib/api';

interface UseSSEReturn {
  events: SSEEvent[];
  status: QueryStatus;
  result: WorkflowResult | null;
  error: string | null;
}

/**
 * Opens a Server-Sent Events connection to /api/stream?workflowId=<id>
 * and maintains a list of events, updating status and result on completion.
 */
export function useSSE(workflowId: string | null): UseSSEReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!workflowId) return;

    // Reset state when a new workflow starts
    setEvents([]);
    setResult(null);
    setError(null);
    setStatus('running');

    const es = new EventSource(`/api/stream?workflowId=${encodeURIComponent(workflowId)}`);
    esRef.current = es;

    const addEvent = (type: SSEEventType, data: { message?: string; timestamp?: string }) => {
      setEvents((prev) => [
        ...prev,
        {
          type,
          message: data.message ?? '',
          timestamp: data.timestamp ?? new Date().toISOString(),
        },
      ]);
    };

    es.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data) as { workflowId: string; timestamp: string };
      addEvent('connected', { message: 'Connected to council session', timestamp: data.timestamp });
    });

    es.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data) as { message: string; timestamp: string };
      addEvent('progress', data);
    });

    es.addEventListener('completed', (e) => {
      const data = JSON.parse(e.data) as { message: string; timestamp: string };
      addEvent('completed', { ...data, message: 'Council session complete' });

      const parsed = parseWorkflowResult(data.message);
      if (parsed) setResult(parsed);

      setStatus('completed');
      es.close();
    });

    es.addEventListener('error', (e) => {
      const data = e instanceof MessageEvent
        ? (JSON.parse(e.data) as { message?: string })
        : { message: 'Connection error' };

      addEvent('error', { message: data.message ?? 'An error occurred' });
      setError(data.message ?? 'An error occurred');
      setStatus('error');
      es.close();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return; // already handled
      setStatus('error');
      setError('Lost connection to server');
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [workflowId]);

  return { events, status, result, error };
}
