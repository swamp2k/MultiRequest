import type { Env, User, WorkflowRow, WorkflowEventRow } from '../types';
import { queryOne, queryMany } from '../lib/db';

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes max

/**
 * GET /api/stream?workflowId=<id>
 *
 * Returns a Server-Sent Events stream. Polls the WorkflowEvents D1 table
 * every 1.5 seconds and emits new events as SSE messages.
 * Closes automatically when a 'completed' or 'error' event is received.
 */
export async function handleStream(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflowId');

  if (!workflowId) {
    return new Response(JSON.stringify({ error: 'workflowId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify the workflow belongs to this user
  const workflow = await queryOne<WorkflowRow>(
    env.DB,
    'SELECT id, status FROM Workflows WHERE id = ? AND user_id = ?',
    [workflowId, user.id]
  );

  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If already done, return its events immediately as a stream and close
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const emit = (eventType: string, data: unknown) => {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    return writer.write(encoder.encode(payload));
  };

  // Polling loop runs as a detached async task within the Worker's lifetime
  (async () => {
    const startTime = Date.now();
    let lastEventId: string | null = null;
    let done = false;

    try {
      // Send initial "connected" heartbeat
      await emit('connected', { workflowId, timestamp: new Date().toISOString() });

      while (!done && Date.now() - startTime < MAX_POLL_DURATION_MS) {
        // Fetch new events since last seen
        const events = lastEventId
          ? await queryMany<WorkflowEventRow>(
              env.DB,
              `SELECT * FROM WorkflowEvents
               WHERE workflow_id = ? AND created_at > (
                 SELECT created_at FROM WorkflowEvents WHERE id = ?
               )
               ORDER BY created_at ASC`,
              [workflowId, lastEventId]
            )
          : await queryMany<WorkflowEventRow>(
              env.DB,
              'SELECT * FROM WorkflowEvents WHERE workflow_id = ? ORDER BY created_at ASC',
              [workflowId]
            );

        for (const event of events) {
          lastEventId = event.id;
          await emit(event.event_type, {
            id: event.id,
            message: event.message,
            timestamp: event.created_at,
          });

          if (event.event_type === 'completed' || event.event_type === 'error') {
            done = true;
          }
        }

        if (!done) {
          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }

      if (!done) {
        await emit('error', { message: 'Workflow timed out' });
      }
    } catch (err) {
      console.error('SSE stream error:', err);
      try {
        await emit('error', { message: 'Stream error' });
      } catch {
        // ignore write errors during cleanup
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
