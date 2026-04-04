import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ModelSetting, ModelRole } from '../../types';
import { getModelById } from '../../lib/models';

interface ModelRowProps {
  model: ModelSetting;
  onChange: (updated: ModelSetting) => void;
  onRemove: (id: string) => void;
}

export default function ModelRow({ model, onChange, onRemove }: ModelRowProps) {
  const [showKey, setShowKey] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: model.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const definition = getModelById(model.model_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 rounded-lg bg-gray-900 border border-gray-800 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripIcon />
      </button>

      {/* Model info + controls */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Row 1: name + provider badge + enable toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm text-gray-100 truncate">
              {definition?.name ?? model.model_id}
            </span>
            <span className="flex-shrink-0 text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
              {definition?.provider ?? 'Unknown'}
            </span>
            {definition?.contextWindow && (
              <span className="flex-shrink-0 text-xs text-gray-600">
                {(definition.contextWindow / 1000).toFixed(0)}k ctx
              </span>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <span className="text-xs text-gray-500">Enable</span>
            <input
              type="checkbox"
              checked={model.is_enabled}
              onChange={(e) => onChange({ ...model, is_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-council-500 focus:ring-council-500"
            />
          </label>
        </div>

        {/* Row 2: role selector + API key field */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Role</label>
            <select
              value={model.role}
              onChange={(e) => onChange({ ...model, role: e.target.value as ModelRole })}
              className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 focus:outline-none focus:ring-1 focus:ring-council-500"
            >
              <option value="primary">Primary Arbiter</option>
              <option value="critic">Critic</option>
            </select>
          </div>

          {/* API key — only show field when model requires a key */}
          {(definition?.requiresApiKey ?? true) && (
            <div className="flex items-center gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-gray-500 whitespace-nowrap">API Key</label>
              <div className="flex-1 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={model.api_key ?? ''}
                  onChange={(e) => onChange({ ...model, api_key: e.target.value })}
                  placeholder={model.has_api_key ? '••••••• (saved)' : 'Enter API key'}
                  className="flex-1 bg-transparent text-xs text-gray-200 focus:outline-none placeholder-gray-600 min-w-0"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="text-gray-600 hover:text-gray-400 flex-shrink-0"
                >
                  {showKey ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Model ID for reference */}
        <p className="text-xs text-gray-700 font-mono truncate">{model.model_id}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(model.id)}
        className="mt-1 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove model"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 14a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 22a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
