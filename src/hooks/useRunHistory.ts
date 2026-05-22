import { useCallback, useEffect, useState } from 'react';
import { RunRecord } from '../types';
import { deleteRunRecord, loadRunHistory, saveRunRecord, updateRunRecord } from '../services/storage';

export function useRunHistory() {
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const records = await loadRunHistory();
    setHistory(records);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRecord = useCallback(async (record: RunRecord) => {
    await saveRunRecord(record);
    setHistory((prev) => [record, ...prev]);
  }, []);

  const removeRecord = useCallback(async (id: string) => {
    await deleteRunRecord(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const renameRecord = useCallback(async (id: string, name: string) => {
    await updateRunRecord(id, name);
    setHistory((prev) => prev.map((r) => r.id === id ? { ...r, name } : r));
  }, []);

  return { history, loading, refresh, addRecord, removeRecord, renameRecord };
}
