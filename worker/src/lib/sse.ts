/**
 * Lightweight SSE helper for Workers.
 * Creates a ReadableStream that can emit typed SSE events.
 */

export interface SSEController {
  emit(eventType: string, data: unknown): Promise<void>;
  close(): Promise<void>;
}

export function createSSEStream(): { readable: ReadableStream; controller: SSEController } {
  const encoder = new TextEncoder();
  let readableController: ReadableStreamDefaultController<Uint8Array>;

  const readable = new ReadableStream<Uint8Array>({
    start(ctrl) {
      readableController = ctrl;
    },
    cancel() {
      // Stream cancelled by client disconnect — nothing to clean up
    },
  });

  const controller: SSEController = {
    async emit(eventType: string, data: unknown) {
      const chunk = encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      readableController.enqueue(chunk);
    },
    async close() {
      readableController.close();
    },
  };

  return { readable, controller };
}
