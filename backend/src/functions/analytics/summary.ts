import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@shared/logger';
import { ok, internalError } from '@shared/http';
import { withAuth } from '@shared/middleware';
import { getEnv } from '@shared/env';
import type { AuthenticatedUser } from '@shared/types';

const logger = new Logger({ service: 'analytics-summary' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const DEVICES_TABLE = getEnv('DEVICES_TABLE_NAME');
const ALERTS_TABLE = getEnv('ALERTS_TABLE_NAME');
const TELEMETRY_TABLE = getEnv('TELEMETRY_TABLE_NAME');

function daysAgoLabel(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const handler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    user: AuthenticatedUser,
  ): Promise<APIGatewayProxyResult> => {
    const log = logger.withRequestId(context.awsRequestId);
    log.info('Get real analytics summary request', { sub: user.sub });

    try {
      // 1. Fetch Devices
      const devicesResponse = await docClient.send(
        new ScanCommand({
          TableName: DEVICES_TABLE,
          ProjectionExpression: 'deviceId, #n, #s, lastSeen',
          ExpressionAttributeNames: { '#n': 'name', '#s': 'status' },
        })
      );
      const devices = devicesResponse.Items || [];
      const totalDevices = devices.length;

      // 2. Fetch Alerts
      const alertsResponse = await docClient.send(
        new ScanCommand({
          TableName: ALERTS_TABLE,
          ProjectionExpression: 'alertId, severity, #s, createdAt',
          ExpressionAttributeNames: { '#s': 'status' },
        })
      );
      const alerts = alertsResponse.Items || [];

      // 3. Fetch Telemetry (last 14 days)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const telemetryResponse = await docClient.send(
        new ScanCommand({
          TableName: TELEMETRY_TABLE,
          FilterExpression: '#ts >= :minDate',
          ExpressionAttributeNames: { '#ts': 'timestamp' },
          ExpressionAttributeValues: { ':minDate': fourteenDaysAgo },
          ProjectionExpression: 'deviceId, #ts, temperatureC, batteryPct'
        })
      );
      const telemetry = telemetryResponse.Items || [];

      // --- Compute Current Stats ---
      const openAlerts30d = alerts.filter(a => a.status !== 'resolved').length;
      const onlineCount = devices.filter(d => d.status === 'online').length;
      const currentAvailability = totalDevices > 0 ? (onlineCount / totalDevices) * 100 : 100;

      // --- Compute Uptime & Offline Durations from lastSeen ---
      const now = Date.now();
      
      const uptimeLeaders = [...devices].map(d => {
        let uptimePct = 0;
        if (d.status === 'online') {
          uptimePct = 99.9;
        } else {
          const lastSeenTime = d.lastSeen ? new Date(d.lastSeen).getTime() : (now - 30 * 24 * 60 * 60 * 1000);
          const offlineHours = (now - lastSeenTime) / (1000 * 60 * 60);
          uptimePct = Math.max(0, 100 - (offlineHours / (30 * 24)) * 100);
        }
        return { name: d.name || d.deviceId, value: Math.round(uptimePct * 10) / 10 };
      }).sort((a, b) => b.value - a.value).slice(0, 8);

      const offlineDurationRanking = [...devices]
        .filter(d => d.status !== 'online')
        .map(d => {
          const lastSeenTime = d.lastSeen ? new Date(d.lastSeen).getTime() : (now - 30 * 24 * 60 * 60 * 1000);
          const offlineHours = (now - lastSeenTime) / (1000 * 60 * 60);
          return { name: d.name || d.deviceId, value: Math.round(offlineHours * 10) / 10 };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // --- Compute Alert Stats by Day (Last 7 days) ---
      const alertStatsByDay = [];
      for (let i = 6; i >= 0; i--) {
        const dateLabel = daysAgoLabel(i);
        // We match by YYYY-MM-DD prefix.
        const dayStart = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        
        const dayAlerts = alerts.filter(a => a.createdAt && a.createdAt.startsWith(dayStart));
        
        alertStatsByDay.push({
          date: dateLabel,
          critical: dayAlerts.filter(a => a.severity === 'critical').length,
          warning: dayAlerts.filter(a => a.severity === 'warning').length,
          info: dayAlerts.filter(a => a.severity === 'info').length,
        });
      }

      // --- Compute Telemetry Trends (Last 14 days) ---
      const availabilityTrend = [];
      const fleetMetricTrend = [];
      
      for (let i = 13; i >= 0; i--) {
        const dateLabel = daysAgoLabel(i);
        const dayStart = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        
        const dayTelemetry = telemetry.filter(t => t.timestamp && t.timestamp.startsWith(dayStart));
        
        // Availability: % of registered devices that sent at least one telemetry point this day
        const uniqueDevicesThisDay = new Set(dayTelemetry.map(t => t.deviceId)).size;
        const availPct = totalDevices > 0 ? (uniqueDevicesThisDay / totalDevices) * 100 : 0;
        
        // For today (i=0), just show the real-time availability to avoid confusing users
        availabilityTrend.push({ 
          date: dateLabel, 
          availabilityPct: i === 0 ? Math.round(currentAvailability * 10) / 10 : Math.round(availPct * 10) / 10 
        });
        
        let avgTemp = 0;
        let avgBat = 0;
        
        if (dayTelemetry.length > 0) {
          const temps = dayTelemetry.map(t => t.temperatureC).filter(t => typeof t === 'number');
          const bats = dayTelemetry.map(t => t.batteryPct).filter(b => typeof b === 'number');
          
          if (temps.length > 0) avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
          if (bats.length > 0) avgBat = bats.reduce((a, b) => a + b, 0) / bats.length;
        }
        
        fleetMetricTrend.push({ 
          date: dateLabel, 
          avgTemp: Math.round(avgTemp * 10) / 10, 
          avgBattery: Math.round(avgBat) 
        });
      }

      return ok({
        currentAvailability: Math.round(currentAvailability * 10) / 10,
        openAlerts30d,
        uptimeLeaders,
        offlineDurationRanking,
        availabilityTrend,
        fleetMetricTrend,
        alertStatsByDay
      });
    } catch (err) {
      log.error('Failed to get analytics summary', err);
      return internalError();
    }
  },
);
