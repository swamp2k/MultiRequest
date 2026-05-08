import type { Env } from './types';
import { router } from './router';

// Re-export the Workflow class so wrangler can bind it
export { ConsensusWorkflow } from './workflows/consensus';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return router(request, env);
  },
} satisfies ExportedHandler<Env>;
