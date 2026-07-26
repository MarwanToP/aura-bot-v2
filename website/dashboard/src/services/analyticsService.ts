import { StorageAdapter } from './storage';
import { INITIAL_ANALYTICS } from './mockData';
import { AnalyticsData } from '../types/analytics';

const ANALYTICS_KEY = 'analytics_metrics';

export const AnalyticsService = {
  getAnalytics(): AnalyticsData {
    return StorageAdapter.get<AnalyticsData>(ANALYTICS_KEY, INITIAL_ANALYTICS);
  },

  refreshMetrics(): AnalyticsData {
    const current = this.getAnalytics();
    // Simulate real-time data jitter
    const updated: AnalyticsData = {
      ...current,
      averageLatencyMs: Math.max(12, current.averageLatencyMs + (Math.floor(Math.random() * 5) - 2)),
      totalCommandsExecuted: current.totalCommandsExecuted + Math.floor(Math.random() * 15)
    };
    StorageAdapter.set(ANALYTICS_KEY, updated);
    return updated;
  }
};
