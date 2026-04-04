import { useRef, useState } from 'react';
import type { QueryStatus } from '../../types';

interface QueryInputProps {
  onSubmit: (query: string, file: File | null) => void;
  status: QueryStatus;
}

export default function QueryInput({ onSubmit, status }: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRunning = status === 'uploading' || status === 'submitting' || status === 'running';
  const canSubmit = query.trim().length > 0 && !isRunning;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(query.trim(), file);
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    const allowed = ['text/', 'application/json', 'application/javascript', 'application/xml'];
    if (!allowed.some((t) => selected.type.startsWith(t)) && !selected.name.match(/\.(txt|log|json|js|ts|py|sh|yaml|yml|md|sql)$/i)) {
      return; // silently ignore binary files
    }
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Query textarea */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste a script, log, or ask the council a question..."
          rows={8}
          disabled={isRunning}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-council-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
              e.preventDefault();
              onSubmit(query.trim(), file);
            }
          }}
        />
        <p className="absolute bottom-2 right-3 text-xs text-gray-700 select-none">
          {query.length > 0 && `${query.length} chars · `}⌘↵ to submit
        </p>
      </div>

      {/* File drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed transition-colors ${
          dragging
            ? 'border-council-500 bg-council-900/20'
            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.log,.json,.js,.ts,.py,.sh,.yaml,.yml,.md,.sql"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <>
            <FileIcon />
            <span className="text-sm text-gray-300 truncate flex-1">{file.name}</span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-600 hover:text-red-400 ml-1"
            >
              <XIcon />
            </button>
          </>
        ) : (
          <>
            <UploadIcon className="text-gray-600" />
            <span className="text-sm text-gray-500">
              Drop a log or script file here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-council-400 hover:text-council-300 underline underline-offset-2"
              >
                browse
              </button>
            </span>
          </>
        )}
      </div>

      {/* Submit row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {isRunning ? (
            <span className="flex items-center gap-1.5 text-council-400">
              <SpinnerIcon />
              {status === 'uploading' ? 'Uploading file...' : status === 'submitting' ? 'Starting session...' : 'Council is deliberating...'}
            </span>
          ) : (
            'The council will debate and reach consensus on your query.'
          )}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-2 text-sm font-semibold bg-council-600 hover:bg-council-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Convene Council
        </button>
      </div>
    </form>
  );
}

// ── Inline icons ───────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function UploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 ${className}`}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}
