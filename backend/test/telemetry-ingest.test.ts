/**
 * Unit tests for Telemetry Ingest handler — Phase 17.
 */
import { handler, type IngestEvent } from '../src/functions/telemetry/ingest';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../src/shared/dynamo';

jest.mock('../src/shared/dynamo', () => ({
  docClient: {
    send: jest.fn()
  }
}));

process.env.TELEMETRY_TABLE_NAME = 'cloudiot-test-telemetry';

describe('Telemetry Ingest Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('drops invalid payloads without throwing', async () => {
    await handler({} as IngestEvent);
    expect(docClient.send).not.toHaveBeenCalled();
  });

  it('saves valid telemetry payload to DynamoDB', async () => {
    await handler({
      deviceId: 'dev-1',
      ts: 1698765432100,
      payload: {
        temperatureC: 22.5,
        batteryPct: 90
      }
    });

    expect(docClient.send).toHaveBeenCalledTimes(1);
    const cmd = (docClient.send as jest.Mock).mock.calls[0][0] as PutCommand;
    expect(cmd.input.TableName).toBe('cloudiot-test-telemetry');
    expect(cmd.input.Item!.deviceId).toBe('dev-1');
    expect(cmd.input.Item!.temperatureC).toBe(22.5);
    expect(cmd.input.Item!.batteryPct).toBe(90);
    expect(cmd.input.Item!.humidityPct).toBeUndefined();
    expect(typeof cmd.input.Item!.ttl).toBe('number');
  });

  it('throws on DynamoDB failure', async () => {
    (docClient.send as jest.Mock).mockRejectedValueOnce(new Error('Dynamo fail'));
    
    await expect(handler({
      deviceId: 'dev-1',
      ts: 1698765432100,
      payload: { temperatureC: 22.5 }
    })).rejects.toThrow('Dynamo fail');
  });
});
