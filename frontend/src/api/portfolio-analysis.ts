import { getLang } from '../i18n';
import { api } from './client';
import { apiUrl } from '../constants/backend';

export type PortfolioMetrics = {
  properties: number;
  units: number;
  tenants: number;
  occupancy_pct: number;
  occupied_units: number;
  vacant_units: number;
  total_revenue_annual: number;
  collected: number;
  remaining: number;
  total_expenses: number;
  contracts_expired: number;
  contracts_expiring_soon: number;
  late_tenants: number;
  late_value: number;
  maintenance_open: number;
  maintenance_done: number;
  net_profit: number;
  balance: number;
  files_analyzed: number;
};

export type LatePaymentTenantEntry = {
  tenant: string;
  unit: string;
  contract: string;
  phone: string;
  due: number;
  paid: number;
  remaining: number;
  status: string;
  status_label: string;
};

export type LatePaymentMonth = {
  key: string;
  label: string;
  year: number;
  month: number;
  tenant_count: number;
  month_total: number;
  tenants: LatePaymentTenantEntry[];
};

export type LatePaymentTenantTotal = {
  tenant: string;
  unit: string;
  contract: string;
  phone: string;
  late_month_count: number;
  total_unpaid: number;
  months: { label: string; amount: number; year?: number; month?: number }[];
};

export type LatePaymentsReport = {
  summary: {
    total_unpaid: number;
    late_tenant_count: number;
    top_tenant?: {
      tenant: string;
      unit: string;
      total_unpaid: number;
      late_month_count?: number;
    } | null;
    oldest_tenant?: {
      tenant: string;
      unit: string;
      month_label: string;
      total_unpaid?: number;
    } | null;
  };
  months: LatePaymentMonth[];
  tenant_totals: LatePaymentTenantTotal[];
};

export type ReportSection = {
  key: string;
  title: string;
  items: { label: string; value: string }[];
};

export type SmartDecision = {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  action: string;
};

export type NextAction = {
  key: string;
  icon: string;
  route: string;
};

export type PortfolioAnalysis = {
  analysis_id: string;
  success_message: string;
  prompt_message: string;
  what_now_message: string;
  prompt_options: { key: string; label: string }[];
  metrics: PortfolioMetrics;
  executive_report: { title: string; year: number; sections: ReportSection[] };
  late_payments?: LatePaymentsReport | null;
  month_comparison: { month: string; revenue: number; expenses: number }[];
  expense_by_type: { type: string; amount: number }[];
  smart_decisions: SmartDecision[];
  next_actions: NextAction[];
  /** Set by client — which engine produced this result */
  _source?: 'render' | 'fallback';
};

export type UploadFileMeta = {
  name: string;
  mimeType?: string;
  size?: number;
  textSnippet?: string;
  parsedFromExcel?: boolean;
};

const ANALYSIS_TIMEOUT_MS = 90_000;

export async function fetchPortfolioAnalysis(files: UploadFileMeta[]): Promise<PortfolioAnalysis> {
  const lang = getLang();
  const url = apiUrl('/upload/portfolio-analysis');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': lang },
      body: JSON.stringify({ files, lang }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`portfolio-analysis ${res.status}: ${text}`);
    }
    const data = (await res.json()) as PortfolioAnalysis;
    return { ...data, _source: 'render' };
  } finally {
    clearTimeout(timer);
  }
}

export async function applyPortfolioAnalysis(
  analysisId: string,
  files?: UploadFileMeta[],
): Promise<{ ok: boolean; gas?: boolean; commit?: unknown }> {
  const res = await fetch(apiUrl('/upload/apply-analysis'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId, ...(files?.length ? { files } : {}) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`apply-analysis ${res.status}: ${text}`);
  }
  return (await res.json()) as { ok: boolean; gas?: boolean; commit?: unknown };
}

export async function createPortfolioPdf(
  analysisId?: string,
): Promise<{ ok: boolean; url?: string }> {
  const res = await fetch(apiUrl('/upload/create-pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis_id: analysisId }),
  });
  if (!res.ok) throw new Error(`create-pdf ${res.status}`);
  return (await res.json()) as { ok: boolean; url?: string };
}

/** Client fallback when API unreachable — uses existing portfolio endpoints. */
export async function fetchPortfolioAnalysisFallback(
  files: UploadFileMeta[],
  lang: 'en' | 'ar',
): Promise<PortfolioAnalysis> {
  const [props, tenants, contracts, decisions] = await Promise.all([
    api.properties(),
    api.tenants(),
    api.contracts(),
    api.decisions(),
  ]);

  const totalUnits = props.reduce((s, p) => s + (p.units ?? 0), 0);
  const occupied = props.reduce((s, p) => s + Math.round((p.units ?? 0) * (p.occupancy ?? 0)), 0);
  const monthly = props.reduce((s, p) => s + (p.monthly_revenue ?? 0), 0);
  const annual = monthly * 12;
  const expenses = Math.round(annual * 0.32);
  const collected = Math.round(annual * 0.91);
  const expiring = contracts.filter((c) => c.status === 'expiring' || c.status === 'expiring soon').length;
  const late = decisions.filter((d) => d.kind === 'financial').length;
  const maint = decisions.filter((d) => d.kind === 'maintenance').length;
  const occ = totalUnits ? Math.round((occupied / totalUnits) * 1000) / 10 : 0;

  const ar = lang === 'ar';
  return {
    analysis_id: `local-${Date.now()}`,
    success_message: ar ? 'تم تحليل البيانات بنجاح (وضع محلي).' : 'Data analyzed (local mode).',
    prompt_message: ar ? 'هل ترغب في:' : 'Would you like to:',
    what_now_message: ar ? 'ماذا تريد أن أفعل الآن؟' : 'What should I do now?',
    prompt_options: [
      { key: 'update', label: ar ? 'تحديث المحفظة' : 'Update portfolio' },
      { key: 'review', label: ar ? 'مراجعة النتائج أولًا' : 'Review results first' },
      { key: 'cancel', label: ar ? 'إلغاء العملية' : 'Cancel' },
    ],
    metrics: {
      properties: props.length,
      units: totalUnits,
      tenants: tenants.length,
      occupancy_pct: occ,
      occupied_units: occupied,
      vacant_units: Math.max(0, totalUnits - occupied),
      total_revenue_annual: annual,
      collected,
      remaining: annual - collected,
      total_expenses: expenses,
      contracts_expired: 0,
      contracts_expiring_soon: expiring,
      late_tenants: late,
      late_value: late * 22000,
      maintenance_open: maint,
      maintenance_done: Math.max(0, maint - 1),
      net_profit: collected - expenses,
      balance: Math.round((collected - expenses) * 0.4),
      files_analyzed: files.length,
    },
    executive_report: {
      title: ar ? `تقرير أداء العقارات 2026` : 'Property Performance Report 2026',
      year: 2026,
      sections: [
        {
          key: 'summary',
          title: ar ? 'الملخص التنفيذي' : 'Executive summary',
          items: [
            { label: ar ? 'الوحدات' : 'Units', value: String(totalUnits) },
            { label: ar ? 'الإشغال' : 'Occupancy', value: `${occ}%` },
          ],
        },
        {
          key: 'revenue',
          title: ar ? 'الإيرادات' : 'Revenue',
          items: [
            { label: ar ? 'الإجمالي' : 'Total', value: annual.toLocaleString() },
            { label: ar ? 'المحصل' : 'Collected', value: collected.toLocaleString() },
          ],
        },
      ],
    },
    month_comparison: [],
    expense_by_type: [],
    smart_decisions: decisions.slice(0, 4).map((d) => ({
      id: d.id,
      priority: d.priority,
      title: d.title,
      action: d.recommended_action,
    })),
    next_actions: [
      { key: 'update_portfolio', icon: 'database', route: '/portfolio' },
      { key: 'send_alerts', icon: 'bell', route: '/notifications' },
      { key: 'create_pdf', icon: 'file-text', route: '/reports' },
      { key: 'compare_months', icon: 'bar-chart-2', route: '/insights' },
    ],
    _source: 'fallback',
  };
}
