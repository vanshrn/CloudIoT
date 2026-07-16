import { useState, useEffect, useCallback } from 'react';
import { getAnalyticsSummary, type AnalyticsSummary } from '@/api/analytics';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getAnalyticsSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
