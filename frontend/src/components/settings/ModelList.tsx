import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { ModelSetting } from '../../types';
import { MODEL_CATALOG } from '../../lib/models';
import ModelRow from './ModelRow';

interface ModelListProps {
  models: ModelSetting[];
  onChange: (models: ModelSetting[]) => void;
}

export default function ModelList({ models, onChange }: ModelListProps) {
  const [addModelId, setAddModelId] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = models.findIndex((m) => m.id === active.id);
    const newIndex = models.findIndex((m) => m.id === over.id);

    const reordered = arrayMove(models, oldIndex, newIndex).map((m, i) => ({
      ...m,
      sort_order: i,
    }));
    onChange(reordered);
  };

  const handleChange = (updated: ModelSetting) => {
    onChange(models.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleRemove = (id: string) => {
    onChange(models.filter((m) => m.id !== id).map((m, i) => ({ ...m, sort_order: i })));
  };

  const handleAdd = () => {
    if (!addModelId) return;

    // Prevent duplicate model_id additions
    if (models.some((m) => m.model_id === addModelId)) {
      setAddModelId('');
      return;
    }

    const newModel: ModelSetting = {
      id: crypto.randomUUID(),
      model_id: addModelId,
      role: models.some((m) => m.role === 'primary') ? 'critic' : 'primary',
      sort_order: models.length,
      is_enabled: true,
      has_api_key: false,
    };

    onChange([...models, newModel]);
    setAddModelId('');
  };

  // Models not yet added
  const availableToAdd = MODEL_CATALOG.filter(
    (m) => !models.some((existing) => existing.model_id === m.id)
  );

  return (
    <div className="space-y-4">
      {/* Model rows with drag-and-drop */}
      {models.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-lg">
          <p className="text-sm">No models configured.</p>
          <p className="text-xs mt-1">Add a model below to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={models.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {models.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  onChange={handleChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Role legend */}
      {models.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-council-500" />
            Primary Arbiter — generates draft + final synthesis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Critic — reviews for errors, risks, flaws
          </span>
        </div>
      )}

      {/* Add model row */}
      {availableToAdd.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <select
            value={addModelId}
            onChange={(e) => setAddModelId(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-council-500"
          >
            <option value="">Select a model to add...</option>
            {availableToAdd.map((m) => (
              <option key={m.id} value={m.id}>
                {m.provider} — {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!addModelId}
            className="px-4 py-2 text-sm font-medium bg-council-700 hover:bg-council-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
