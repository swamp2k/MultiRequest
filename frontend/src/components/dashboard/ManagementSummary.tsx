import type { WorkflowResult } from '../../types';
import ConsensusMeter from '../settings/ConsensusMeter';

interface ManagementSummaryProps {
  result: WorkflowResult;
}

/**
 * High-level summary card shown after the council completes.
 * Renders the Management Summary section from the final response,
 * a status badge, and the consensus meter.
 */
export default function ManagementSummary({ result }: ManagementSummaryProps) {
  const { managementSection, status } = parseFinalResponse(result.final);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-200">Management Summary</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">{result.primaryModel}</span>
          <span>+</span>
          <span className="font-mono">{result.criticModel}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        {/* Management summary prose */}
        <div className="prose prose-sm prose-invert max-w-none">
          <MarkdownContent content={managementSection || result.final} />
        </div>

        {/* Consensus meter */}
        <ConsensusMeter score={result.score} className="max-w-xs" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'critical' | 'unknown' }) {
  const config = {
    ok: { label: 'Looks Good', className: 'bg-green-900/50 text-green-300 border-green-800' },
    warning: { label: 'Warning', className: 'bg-amber-900/50 text-amber-300 border-amber-800' },
    critical: { label: 'Critical Issue', className: 'bg-red-900/50 text-red-300 border-red-800' },
    unknown: { label: 'Reviewed', className: 'bg-gray-800 text-gray-400 border-gray-700' },
  };
  const { label, className } = config[status];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}

/** Very simple Markdown renderer — just handles code blocks and line breaks for Phase 1. */
function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre key={i} className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto">
              <code>{code}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </>
  );
}

/** Parse the final response to extract the ## Management Summary section. */
function parseFinalResponse(final: string): {
  managementSection: string | null;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
} {
  const managementMatch = final.match(/##\s*Management Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
  const managementSection = managementMatch ? managementMatch[1].trim() : null;

  const content = final.toLowerCase();
  let status: 'ok' | 'warning' | 'critical' | 'unknown' = 'unknown';

  if (content.includes('critical') || content.includes('🔴')) {
    status = 'critical';
  } else if (content.includes('warning') || content.includes('⚠️') || content.includes('caution')) {
    status = 'warning';
  } else if (content.includes('correct') || content.includes('✅') || content.includes('looks good')) {
    status = 'ok';
  }

  return { managementSection, status };
}
