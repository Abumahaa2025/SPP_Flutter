const RAW = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_BASE = `${RAW}/api`;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  briefing: () => req<Briefing>('/briefing'),
  properties: () => req<PropertyT[]>('/properties'),
  property: (id: string) => req<PropertyT>(`/properties/${id}`),
  decisions: () => req<DecisionT[]>('/decisions'),
  tenants: () => req<TenantT[]>('/tenants'),
  contracts: () => req<ContractT[]>('/contracts'),
  timeline: () => req<TimelineT[]>('/timeline'),
  sensors: () => req<SensorT[]>('/sensors'),
  notifications: () => req<NotifT[]>('/notifications'),
  chatSend: (session_id: string, text: string) =>
    req<{ reply: string; at: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ session_id, text }),
    }),
  chatHistory: (sid: string) => req<ChatMsg[]>(`/chat/${sid}`),
};

// Types
export type DecisionT = {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  kind: 'maintenance' | 'financial' | 'tenant' | 'opportunity';
  title: string;
  reason: string;
  impact: string;
  recommended_action: string;
  confidence: number;
  property_id?: string;
  created_at: string;
};

export type Briefing = {
  salutation: string;
  owner_name: string;
  headline: string;
  portfolio_annual_revenue: number;
  avg_health: number;
  occupancy: number;
  properties_count: number;
  decisions: DecisionT[];
  sensor_alerts: SensorT[];
};

export type PropertyT = {
  id: string; name: string; address: string; city: string;
  kind: string; units: number; occupancy: number;
  monthly_revenue: number; health_score: number; hero_image: string;
  tenant_ids: string[]; owner_id: string;
};

export type TenantT = {
  id: string; name: string; property_id: string; unit: string;
  since: string; rent: number; reliability: number;
};

export type ContractT = {
  id: string; tenant_id: string; property_id: string;
  start: string; end: string; monthly_rent: number; status: string;
};

export type TimelineT = {
  id: string; property_id: string; kind: string;
  title: string; subtitle: string; at: string;
};

export type SensorT = {
  id: string; property_id: string; kind: string; label: string;
  value: number; unit: string; status: 'nominal' | 'attention' | 'critical';
  trend: 'up' | 'down' | 'flat';
};

export type NotifT = {
  id: string; title: string; body: string; priority: string;
  at: string; read: boolean;
};

export type ChatMsg = {
  id: string; role: 'user' | 'assistant'; text: string; at: string;
};
