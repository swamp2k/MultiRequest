import { useCallback, useEffect, useState } from 'react';
import type { ModelSetting } from '../types';
import { getSettings, saveSettings } from '../lib/api';

interface UseSettingsReturn {
  models: ModelSetting[];
  setModels: React.Dispatch<React.SetStateAction<ModelSetting[]>>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [models, setModels] = useState<ModelSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setModels(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await saveSettings(models);
      // Reload to get fresh has_api_key flags and clear local api_key fields
      await refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [models, refresh]);

  return { models, setModels, loading, saving, error, success, save, refresh };
}
