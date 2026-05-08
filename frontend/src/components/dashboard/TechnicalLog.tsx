import { useState } from 'react';
import type { WorkflowResult } from '../../types';

interface TechnicalLogProps {
  result: WorkflowResult;
}

/**
 * Collapsible technical log showing the full council debate trail:
 *  - Primary's initial draft
 *  - Critic's review
 *  - Final synthesized response (with Technical Detail section)
 *  - Side-by-side diff view between draft and final
 */
export default function TechnicalLog({ result }: TechnicalLogProps) {
  return (
    <details className="group rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-gray-900/60 transition-colors">
        <div className="flex items-center gap-2">
          <ChevronIcon />
          <span className="text-sm font-semibold text-gray-300">Technical Log — Council Debate</span>
        </div>
        <span className="text-xs text-gray-600">3 steps</span>
      </summary>

      <div className="divide-y divide-gray-800">
        {/* Step 1: Primary Draft */}
        <DebateSection
          step={1}
          label="Primary Draft"
          model={result.primaryModel}
          role="primary"
          content={result.draft}
        />

        {/* Step 2: Critic Review */}
        <DebateSection
          step={2}
          label="Critic's Review"
          model={result.criticModel}
          role="critic"
          content={result.critique}
        />

        {/* Step 3: Final Synthesis */}
        <DebateSection
          step={3}
          label="Final Synthesis"
          model={result.primaryModel}
          role="primary"
          content={result.final}
        />

        {/* Diff view */}
        <DiffSection draft={result.draft} final={result.final} />
      </div>
    </details>
  );
}

function DebateSection({
  step,
  label,
  model,
  role,
  content,
}: {
  step: number;
  label: string;
  model: string;
  role: 'primary' | 'critic';
  content: string;
}) {
  const [expanded, setExpanded] = useState(step === 3);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-900/50 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-gray-800 text-xs font-mono font-bold text-gray-400 flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <span className="text-sm font-medium text-gray-300 flex-1">{label}</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            role === 'primary'
              ? 'bg-council-900/60 text-council-400'
              : 'bg-amber-900/30 text-amber-400'
          }`}
        >
          {role === 'primary' ? 'Primary' : 'Critic'}
        </span>
        <span className="text-xs text-gray-600 font-mono truncate max-w-32">{model}</span>
        <SmallChevronIcon open={expanded} />
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          <pre className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-thin">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

function DiffSection({ draft, final }: { draft: string; final: string }) {
  const [expanded, setExpanded] = useState(false);

  const draftLines = draft.split('\n');
  const finalLines = final.split('\n');

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-900/50 transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-gray-800 text-xs font-mono font-bold text-gray-400 flex items-center justify-center flex-shrink-0">
          ~
        </span>
        <span className="text-sm font-medium text-gray-300 flex-1">Diff: Draft → Final</span>
        <SmallChevronIcon open={expanded} />
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <div className="mb-1.5 text-red-400 font-semibold">− Draft</div>
              <pre className="bg-gray-950 rounded-lg p-3 text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto scrollbar-thin">
                {draftLines.map((line, i) => {
                  const inFinal = finalLines.some((fl) => fl.trim() === line.trim() && line.trim().length > 4);
                  return (
                    <span
                      key={i}
                      className={`block ${!inFinal && line.trim() ? 'bg-red-900/20 text-red-300' : ''}`}
                    >
                      {line || ' '}
                    </span>
                  );
                })}
              </pre>
            </div>
            <div>
              <div className="mb-1.5 text-green-400 font-semibold">+ Final</div>
              <pre className="bg-gray-950 rounded-lg p-3 text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto scrollbar-thin">
                {finalLines.map((line, i) => {
                  const inDraft = draftLines.some((dl) => dl.trim() === line.trim() && line.trim().length > 4);
                  return (
                    <span
                      key={i}
                      className={`block ${!inDraft && line.trim() ? 'bg-green-900/20 text-green-300' : ''}`}
                    >
                      {line || ' '}
                    </span>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="transition-transform group-open:rotate-90 flex-shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SmallChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
