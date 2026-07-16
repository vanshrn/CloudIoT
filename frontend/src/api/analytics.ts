import { apiClient } from './client';


export interface AnalyticsSummary {
  currentAvailability: number;
  openAlerts30d: number;
  uptimeLeaders: { name: string; value: number }[];
  offlineDurationRanking: { name: string; value: number }[];
  availabilityTrend: { date: string; availabilityPct: number }[];
  fleetMetricTrend: { date: string; avgTemp: number; avgBattery: number }[];
  alertStatsByDay: { date: string; critical: number; warning: number; info: number }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return response.data;
}
