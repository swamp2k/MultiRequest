import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { QueryStatus } from '../types';
import { uploadFile, submitQuery } from '../lib/api';
import { useSSE } from '../hooks/useSSE';
import QueryInput from '../components/dashboard/QueryInput';
import ProgressFeed from '../components/dashboard/ProgressFeed';
import ManagementSummary from '../components/dashboard/ManagementSummary';
import TechnicalLog from '../components/dashboard/TechnicalLog';

export default function DashboardPage() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<QueryStatus>('idle');

  const { events, status: sseStatus, result, error: sseError } = useSSE(workflowId);

  // Combine submit + sse statuses for the input component
  const displayStatus: QueryStatus =
    submitStatus !== 'idle' && sseStatus === 'idle' ? submitStatus : sseStatus;

  const handleSubmit = async (query: string, file: File | null) => {
    setSubmitError(null);
    setWorkflowId(null);

    try {
      let uploadKey: string | undefined;

      if (file) {
        setSubmitStatus('uploading');
        const { key } = await uploadFile(file);
        uploadKey = key;
      }

      setSubmitStatus('submitting');
      const { workflowId: id } = await submitQuery(query, uploadKey);
      setWorkflowId(id);
      setSubmitStatus('idle'); // SSE takes over from here
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start session';
      setSubmitError(msg);
      setSubmitStatus('idle');
    }
  };

  const hasOutput = result !== null;
  const hasEvents = events.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: input (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-50">Convene the Council</h1>
            <p className="mt-1 text-sm text-gray-400">
              Submit a script, log, or question. The Primary Arbiter and Critic will debate,
              then synthesise a consensus answer.
            </p>
          </div>

          <QueryInput onSubmit={handleSubmit} status={displayStatus} />

          {/* Submit error */}
          {submitError && (
            <div className="px-4 py-3 rounded-lg bg-red-900/20 border border-red-800/50 text-sm text-red-300">
              {submitError}
              {submitError.includes('Settings') && (
                <Link to="/settings" className="ml-2 underline underline-offset-2 hover:text-red-200">
                  Go to Settings →
                </Link>
              )}
            </div>
          )}

          {/* Live progress feed */}
          {hasEvents && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Council Activity
              </h2>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <ProgressFeed events={events} />
              </div>
            </div>
          )}

          {/* SSE error */}
          {sseError && (
            <div className="px-4 py-3 rounded-lg bg-red-900/20 border border-red-800/50 text-sm text-red-300">
              {sseError}
            </div>
          )}
        </div>

        {/* Right column: output (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {!hasOutput && !hasEvents && (
            <EmptyState />
          )}

          {hasOutput && result && (
            <>
              <ManagementSummary result={result} />
              <TechnicalLog result={result} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 text-center py-16 px-8 border border-dashed border-gray-800 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-council-900/40 flex items-center justify-center mb-4">
        <CouncilIcon />
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">Awaiting the Council</h3>
      <p className="text-xs text-gray-500 max-w-xs">
        Submit a query on the left. The primary model and critic will debate in real time,
        then produce a verified consensus answer.
      </p>
      <Link
        to="/settings"
        className="mt-5 text-xs text-council-400 hover:text-council-300 underline underline-offset-2"
      >
        Configure models first →
      </Link>
    </div>
  );
}

function CouncilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-council-400">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
