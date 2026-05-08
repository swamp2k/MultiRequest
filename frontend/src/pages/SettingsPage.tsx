import { useSettings } from '../hooks/useSettings';
import ModelList from '../components/settings/ModelList';

export default function SettingsPage() {
  const { models, setModels, loading, saving, error, success, save } = useSettings();

  const primaryCount = models.filter((m) => m.role === 'primary' && m.is_enabled).length;
  const criticCount = models.filter((m) => m.role === 'critic' && m.is_enabled).length;
  const isValid = primaryCount >= 1 && criticCount >= 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Council Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure which models participate in the consensus workflow. Drag to reorder — the
          first enabled Primary model and first enabled Critic will be used for Phase 1.
        </p>
      </div>

      {/* Validation hints */}
      <div className="grid grid-cols-2 gap-3">
        <StatusCard
          label="Primary Arbiter"
          count={primaryCount}
          required={1}
          description="Generates draft + synthesis"
        />
        <StatusCard
          label="Critic"
          count={criticCount}
          required={1}
          description="Reviews for errors & risks"
        />
      </div>

      {/* Model list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Model Roster
          </h2>
          <span className="text-xs text-gray-500">{models.length} configured</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading settings...</div>
        ) : (
          <ModelList models={models} onChange={setModels} />
        )}
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-gray-950/90 backdrop-blur border-t border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isValid && !loading && (
            <p className="text-xs text-amber-400">
              Add at least one Primary Arbiter and one Critic to enable queries.
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">Settings saved successfully.</p>}
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="px-5 py-2 text-sm font-semibold bg-council-600 hover:bg-council-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  count,
  required,
  description,
}: {
  label: string;
  count: number;
  required: number;
  description: string;
}) {
  const ok = count >= required;
  return (
    <div
      className={`p-4 rounded-lg border ${
        ok
          ? 'border-green-800/50 bg-green-900/10'
          : 'border-amber-800/50 bg-amber-900/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span
          className={`text-lg font-bold font-mono ${ok ? 'text-green-400' : 'text-amber-400'}`}
        >
          {count}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}
