/**
 * Materialize upload analysis (Property Knowledge + lifecycle) into local PropertyOS.
 * Used after owner Approves Apply — so portfolio/tenants/reports reflect imported engines.
 */
import type { PortfolioAnalysis } from '@/src/api/portfolio-analysis';
import type { ReportT } from '@/src/api/client';
import type {
  ContractRecord,
  PropertyOSState,
  PropertyRecord,
  TenantRecord,
  UnitRecord,
} from '@/src/types/property-os';
import { buildTenantPortal, buildWhatsAppWelcome } from '@/src/hooks/usePropertyOS';
import { storage } from '@/src/utils/storage';

const OS_KEY = 'spp.propertyOS';
const REPORTS_KEY = 'spp.importedReports';

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type ActiveRow = {
  tenant?: string;
  name?: string;
  unit?: string;
  phone?: string;
  rent?: number;
};

function activeRows(analysis: PortfolioAnalysis): ActiveRow[] {
  const pk = analysis.property_knowledge;
  const lc = pk?.lifecycle?.active;
  const cards = pk?.tenants || [];
  const phoneByUnit = new Map(
    cards
      .filter((t) => t.unit)
      .map((t) => [String(t.unit), (t.phone || '').trim()] as const),
  );

  if (lc?.length) {
    return lc.map((row) => ({
      ...row,
      phone: (row.phone || '').trim() || phoneByUnit.get(String(row.unit || '')) || '',
    }));
  }
  if (cards.length) {
    return cards.map((t) => ({
      tenant: t.tenant,
      unit: t.unit,
      phone: t.phone,
      rent: t.rent,
    }));
  }
  return [];
}

export type ApplyCommit = {
  analysis_id: string;
  property_id: string;
  units: number;
  tenants: number;
  contracts: number;
  report_id: string;
  period?: string;
  success_message?: string;
  summary?: {
    properties?: number;
    units?: number;
    tenants?: number;
    contracts?: number;
    rents?: number;
    collected?: number;
    remaining?: number;
    late_tenants?: number;
    contracts_expired?: number;
    contracts_expiring_soon?: number;
    gaps?: number;
  };
};

export function buildPropertyOSFromAnalysis(
  analysis: PortfolioAnalysis,
  lang: 'ar' | 'en',
): { state: PropertyOSState; report: ReportT; commit: ApplyCommit } {
  const m = analysis.metrics;
  const brief = analysis.executive_brief;
  const period = brief?.period || '';
  const propId = `prop_imp_${analysis.analysis_id.slice(0, 8)}`;
  const now = new Date().toISOString();

  const property: PropertyRecord = {
    id: propId,
    name: lang === 'ar' ? 'العقار المستورد' : 'Imported property',
    type: 'mixed',
    city: '—',
    district: period || '—',
    buildingCount: 1,
    unitCount: Math.max(1, m.units || 0),
    createdAt: now,
  };

  const rows = activeRows(analysis);
  const units: UnitRecord[] = [];
  const tenants: TenantRecord[] = [];
  const contracts: ContractRecord[] = [];

  rows.forEach((row, i) => {
    const unitNum = String(row.unit || i + 1);
    const unitId = `unit_imp_${unitNum}`.replace(/\s+/g, '_');
    const rent = Number(row.rent || 0) || 0;
    const isShop = /محل|shop|تجاري/i.test(unitNum);
    units.push({
      id: unitId,
      propertyId: propId,
      number: unitNum,
      type: isShop ? 'shop' : 'apartment',
      status: 'occupied',
      rentAmount: rent,
      rentPeriod: 'monthly',
      paymentMethod: 'transfer',
      paymentDueDay: 1,
      electricity: 'tenant',
      water: 'tenant',
      internet: 'tenant',
      gas: 'independent',
      maintenanceBy: 'owner',
      hasInsurance: false,
    });

    const tid = `ten_imp_${i + 1}`;
    const token = uid('tok').slice(-12);
    const portal = buildTenantPortal(tid, token);
    const name = (row.tenant || row.name || '—').trim() || '—';
    const phone = (row.phone || '').trim();
    tenants.push({
      id: tid,
      name,
      phone,
      email: '',
      unitId,
      moveInDate: now.slice(0, 10),
      portalToken: portal.token,
      portalUrl: portal.url,
      qrData: portal.qrData,
      whatsAppMessage: buildWhatsAppWelcome(name, portal.url, lang),
    });

    if (i < 10) {
      contracts.push({
        id: `ct_imp_${i + 1}`,
        number: `IMP-${i + 1}`,
        tenantId: tid,
        unitId,
        startDate: now.slice(0, 10),
        endDate: now.slice(0, 10),
        rentAmount: rent,
        paymentType: 'monthly',
        depositAmount: 0,
        specialTerms: lang === 'ar' ? 'من اعتماد الاستيراد' : 'From import apply',
      });
    }
  });

  // Ensure unitCount matches materialised units
  property.unitCount = Math.max(property.unitCount, units.length);

  const summary = analysis.summary || {
    properties: 1,
    units: m.units || units.length,
    tenants: tenants.length,
    contracts: contracts.length,
    rents: m.rents ?? m.total_revenue_annual ?? 0,
    collected: m.collected ?? 0,
    remaining: m.remaining ?? 0,
    late_tenants: m.late_tenants ?? 0,
    late_value: m.late_value ?? 0,
    contracts_expired: m.contracts_expired ?? 0,
    contracts_expiring_soon: m.contracts_expiring_soon ?? 0,
    missing_phone: m.missing_phone ?? 0,
    missing_contract: m.missing_contract ?? 0,
    gaps: m.gaps ?? 0,
  };

  const report: ReportT = {
    id: analysis.analysis_id,
    kind: 'monthly',
    title: brief?.title || analysis.executive_report?.title || (lang === 'ar' ? 'التقرير التنفيذي' : 'Executive report'),
    subtitle: period || (lang === 'ar' ? 'بعد اعتماد الاستيراد' : 'After import apply'),
    highlight: (analysis.success_message || brief?.property_status || '').slice(0, 160),
    created_at: now,
    pages: Math.max(1, analysis.executive_report?.sections?.length || 1),
    accent: 'gold',
  };

  const state: PropertyOSState = {
    property,
    units,
    tenants,
    contracts,
    alertsEnabled: true,
    technicianPortalToken: uid('tech').slice(-12),
    dismissedProgress: true,
    setupCompleted: true,
    unitHistory: [],
    payments: [],
    startedAt: now,
  };

  return {
    state,
    report,
    commit: {
      analysis_id: analysis.analysis_id,
      property_id: propId,
      units: units.length,
      tenants: tenants.length,
      contracts: contracts.length,
      report_id: report.id,
      period,
      success_message: analysis.success_message,
      summary: {
        ...summary,
        properties: summary.properties ?? 1,
        units: units.length,
        tenants: tenants.length,
        contracts: contracts.length,
      },
    },
  };
}

/** Persist OS + imported report so portfolio / tenants / reports screens show Apply results. */
export async function persistApplyFromAnalysis(
  analysis: PortfolioAnalysis,
  lang: 'ar' | 'en',
): Promise<ApplyCommit> {
  const { state, report, commit } = buildPropertyOSFromAnalysis(analysis, lang);
  await storage.setItem(OS_KEY, JSON.stringify(state));
  const prevRaw = await storage.getItem<string>(REPORTS_KEY, '[]');
  let prev: ReportT[] = [];
  try {
    prev = JSON.parse(prevRaw || '[]') as ReportT[];
  } catch {
    prev = [];
  }
  const next = [report, ...prev.filter((r) => r.id !== report.id)].slice(0, 20);
  await storage.setItem(REPORTS_KEY, JSON.stringify(next));
  await storage.setItem(
    'spp.lastApplyProof',
    JSON.stringify({ ...commit, applied_at: new Date().toISOString(), source: 'property_knowledge' }),
  );
  return commit;
}
