export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface AnalyticsData {
  uptimePercentage: number;
  averageLatencyMs: number;
  totalCommandsExecuted: number;
  activeServersCount: number;
  latencyHistory: TimeSeriesPoint[];
  commandUsageHistory: TimeSeriesPoint[];
  serverGrowthHistory: TimeSeriesPoint[];
  categoryDistribution: { category: string; count: number; percentage: number }[];
  topCommands: { command: string; calls: number }[];
}
