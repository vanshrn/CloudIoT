export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // e.g. "ciot_live_8f2a…"
  createdAt: string;
  lastUsed: string | null;
  scope: 'full' | 'read-only';
}
