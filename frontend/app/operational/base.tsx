/**
 * WP-5 — Professional property operations base.
 * Tabs: Properties · Units · Import history — linked via PropertyOS relationships.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { OperationalTenantCard } from '@/src/components/OperationalTenantCard';
import { OperationalContractCard } from '@/src/components/OperationalContractCard';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { storage } from '@/src/utils/storage';
import type { ImportBatch } from '@/src/types/property-os';
import {
  buildOperationalPropertyViews,
  buildOperationalUnitViews,
  computePortfolioKpis,
  filterPropertyViews,
  filterUnitViews,
  sortPropertyViews,
  sortUnitViews,
  type OpsFilterId,
  type OpsKpiId,
  type OpsSortId,
  type OpsTabId,
  type OperationalPropertyView,
  type OperationalUnitView,
} from '@/src/utils/operational-property-base';
import { buildOperationalContractViews } from '@/src/utils/operational-contracts';
import { useRouter } from 'expo-router';

function fmtMoney(n: number, ar: boolean) {
  return `${Number(n || 0).toLocaleString()} ${ar ? 'ر.س' : 'SAR'}`;
}

const TABS: { id: OpsTabId; ar: string; en: string }[] = [
  { id: 'properties', ar: 'العقارات', en: 'Properties' },
  { id: 'units', ar: 'الوحدات', en: 'Units' },
  { id: 'imports', ar: 'سجل الاستيراد', en: 'Import history' },
];

const FILTERS: { id: OpsFilterId; ar: string; en: string }[] = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'arrears', ar: 'متأخرات', en: 'Arrears' },
  { id: 'incomplete', ar: 'بيانات ناقصة', en: 'Incomplete' },
  { id: 'occupied', ar: 'مؤجرة', en: 'Occupied' },
  { id: 'vacant', ar: 'شاغرة', en: 'Vacant' },
  { id: 'needs_review', ar: 'تحتاج مراجعة', en: 'Needs review' },
];

const SORTS: { id: OpsSortId; ar: string; en: string }[] = [
  { id: 'revenue', ar: 'الإيراد', en: 'Revenue' },
  { id: 'arrears', ar: 'المتأخرات', en: 'Arrears' },
  { id: 'units', ar: 'عدد الوحدات', en: 'Units' },
  { id: 'occupancy', ar: 'الإشغال', en: 'Occupancy' },
  { id: 'unit_number', ar: 'رقم الوحدة', en: 'Unit no.' },
  { id: 'tenant', ar: 'المستأجر', en: 'Tenant' },
];

function Row({ label, value, rtl, tone, missing }: {
  label: string; value: string; rtl?: boolean; tone?: string; missing?: boolean;
}) {
  const color = tone === 'ok' ? colors.emerald : tone === 'danger' ? colors.danger
    : tone === 'warn' ? colors.gold : missing ? colors.textMuted : colors.text;
  return (
    <View style={[styles.row, rtl && styles.rowRtl]}>
      <Text style={[styles.rowLabel, rtl && styles.rtl]}>{label}</Text>
      <Text style={[styles.rowVal, rtl && styles.rtl, { color }]}>{value}</Text>
    </View>
  );
}

export default function OperationalBaseScreen() {
  const { t, isRTL, lang } = useI18n();
  const ar = lang === 'ar' || !!isRTL;
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; focus?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state: osState, reload: reloadOS } = usePropertyOS(countEnabled);
  const { tickets, reload: reloadOps } = useOperational();

  const initialTab = (['properties', 'units', 'imports'].includes(String(params.tab))
    ? String(params.tab)
    : 'properties') as OpsTabId;

  const [tab, setTab] = useState<OpsTabId>(initialTab);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OpsFilterId>('all');
  const [sort, setSort] = useState<OpsSortId>('revenue');
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<OperationalPropertyView | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OperationalUnitView | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reloadOS();
      void reloadOps();
      storage.getItem<string>('spp.importBatches', '[]').then((raw) => {
        try {
          setBatches(JSON.parse(raw || '[]') as ImportBatch[]);
        } catch {
          setBatches([]);
        }
      });
      if (params.tab && ['properties', 'units', 'imports'].includes(String(params.tab))) {
        setTab(String(params.tab) as OpsTabId);
      }
    }, [reloadOS, reloadOps, params.tab]),
  );

  const kpis = useMemo(() => computePortfolioKpis(osState, tickets), [osState, tickets]);
  const propViews = useMemo(() => buildOperationalPropertyViews(osState, tickets, ar), [osState, tickets, ar]);
  const unitViews = useMemo(() => buildOperationalUnitViews(osState, tickets, ar), [osState, tickets, ar]);
  const contractViews = useMemo(() => buildOperationalContractViews(osState, ar), [osState, ar]);

  const visibleProps = useMemo(
    () => sortPropertyViews(filterPropertyViews(propViews, query, filter), sort),
    [propViews, query, filter, sort],
  );
  const visibleUnits = useMemo(
    () => sortUnitViews(filterUnitViews(unitViews, query, filter), sort === 'occupancy' || sort === 'units' ? 'unit_number' : sort),
    [unitViews, query, filter, sort],
  );

  const onKpiPress = (id: OpsKpiId) => {
    Haptics.selectionAsync();
    if (id === 'properties') { setTab('properties'); setFilter('all'); return; }
    if (id === 'units') { setTab('units'); setFilter('all'); return; }
    if (id === 'occupied') { setTab('units'); setFilter('occupied'); return; }
    if (id === 'vacant') { setTab('units'); setFilter('vacant'); return; }
    if (id === 'contracts') { router.push('/contracts' as any); return; }
    if (id === 'arrears' || id === 'remaining') { setTab('units'); setFilter('arrears'); return; }
    if (id === 'collected') { router.push('/operational/payments' as any); return; }
  };

  const openPropertyUnits = (p: OperationalPropertyView) => {
    Haptics.selectionAsync();
    setSelectedProperty(p);
    setTab('units');
    setFilter('all');
    setQuery('');
  };

  const kpiCards: { id: OpsKpiId; label: string; value: string; testID: string }[] = [
    { id: 'properties', label: ar ? 'العقارات' : 'Properties', value: String(kpis.properties), testID: 'ops-kpi-properties' },
    { id: 'units', label: ar ? 'الوحدات' : 'Units', value: String(kpis.units), testID: 'ops-kpi-units' },
    { id: 'occupied', label: ar ? 'المؤجرة' : 'Occupied', value: String(kpis.occupied), testID: 'ops-kpi-occupied' },
    { id: 'vacant', label: ar ? 'الشاغرة' : 'Vacant', value: String(kpis.vacant), testID: 'ops-kpi-vacant' },
    { id: 'contracts', label: ar ? 'العقود' : 'Contracts', value: String(kpis.contracts), testID: 'ops-kpi-contracts' },
    { id: 'arrears', label: ar ? 'المتأخرات' : 'Arrears', value: fmtMoney(kpis.arrearsTotal, ar), testID: 'ops-kpi-arrears' },
    { id: 'collected', label: ar ? 'المحصل' : 'Collected', value: fmtMoney(kpis.collected, ar), testID: 'ops-kpi-collected' },
    { id: 'remaining', label: ar ? 'المتبقي' : 'Remaining', value: fmtMoney(kpis.remaining, ar), testID: 'ops-kpi-remaining' },
  ];

  const empty = !osState.property && osState.units.length === 0;

  return (
    <ScreenScaffold testID="ops-base-screen">
      <StoryScreenHeader
        question={ar ? 'قاعدة تشغيل العقارات' : 'Property operations'}
        hint={ar ? 'إدارة يومية مترابطة من بيانات الاستيراد' : 'Linked daily ops from import data'}
        showBack
        testID="ops-base-header"
      />

      {empty ? (
        <AliveEmpty
          title={ar ? 'لا توجد قاعدة تشغيل بعد' : 'No operational base yet'}
          body={ar ? 'ارفع كشفًا واعتمده (Apply) لبناء العقارات والوحدات.' : 'Upload and Apply a statement to build properties and units.'}
          actionLabel={ar ? 'رفع كشف' : 'Upload'}
          onAction={() => router.push('/upload' as any)}
        />
      ) : (
        <>
          <View style={[styles.kpiGrid, isRTL && styles.rowRtl]} testID="ops-kpi-grid">
            {kpiCards.map((k) => (
              <Pressable
                key={k.id}
                testID={k.testID}
                onPress={() => onKpiPress(k.id)}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {TABS.map((tb) => (
              <Pressable
                key={tb.id}
                testID={`ops-tab-${tb.id}`}
                onPress={() => { Haptics.selectionAsync(); setTab(tb.id); }}
                style={[styles.chip, tab === tb.id && styles.chipOn]}
              >
                <Text style={[styles.chipText, tab === tb.id && styles.chipTextOn]}>{ar ? tb.ar : tb.en}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {tab !== 'imports' ? (
            <>
              <TextInput
                testID="ops-search"
                value={query}
                onChangeText={setQuery}
                placeholder={ar ? 'بحث سريع…' : 'Quick search…'}
                placeholderTextColor={colors.textSubtle}
                style={[styles.search, isRTL && styles.rtl]}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {FILTERS.map((f) => (
                  <Pressable
                    key={f.id}
                    testID={`ops-filter-${f.id}`}
                    onPress={() => { Haptics.selectionAsync(); setFilter(f.id); }}
                    style={[styles.chip, filter === f.id && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, filter === f.id && styles.chipTextOn]}>{ar ? f.ar : f.en}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {(tab === 'properties'
                  ? SORTS.filter((s) => ['revenue', 'arrears', 'units', 'occupancy'].includes(s.id))
                  : SORTS.filter((s) => ['revenue', 'arrears', 'unit_number', 'tenant'].includes(s.id))
                ).map((s) => (
                  <Pressable
                    key={s.id}
                    testID={`ops-sort-${s.id}`}
                    onPress={() => { Haptics.selectionAsync(); setSort(s.id); }}
                    style={[styles.chip, sort === s.id && styles.chipOnSort]}
                  >
                    <Text style={[styles.chipText, sort === s.id && styles.chipTextOn]}>
                      {(ar ? 'ترتيب: ' : 'Sort: ') + (ar ? s.ar : s.en)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          {tab === 'properties' ? (
            <View testID="ops-properties-list">
              <Text style={[styles.count, isRTL && styles.rtl]}>
                {visibleProps.length} {ar ? 'عقار' : 'properties'}
              </Text>
              {visibleProps.map((p) => (
                <Pressable
                  key={p.id}
                  testID={`ops-property-${p.id}`}
                  onPress={() => openPropertyUnits(p)}
                  style={{ marginBottom: spacing.md }}
                >
                  <GlassCard padding={18} radiusToken="lg" edge="gold">
                    <Text style={[styles.title, isRTL && styles.rtl]}>{p.name}</Text>
                    <Text style={[styles.sub, isRTL && styles.rtl]}>
                      {p.cityMissing ? 'Requires Source Support' : p.city}
                    </Text>
                    <View style={styles.hair} />
                    <Row label={ar ? 'الوحدات' : 'Units'} value={String(p.unitCount)} rtl={!!isRTL} />
                    <Row label={ar ? 'مؤجرة' : 'Occupied'} value={String(p.occupiedCount)} rtl={!!isRTL} tone="ok" />
                    <Row label={ar ? 'شاغرة' : 'Vacant'} value={String(p.vacantCount)} rtl={!!isRTL} />
                    <Row label={ar ? 'الإشغال' : 'Occupancy'} value={`${p.occupancyPct}%`} rtl={!!isRTL} />
                    <Row label={ar ? 'إجمالي الإيجارات' : 'Total rent'} value={fmtMoney(p.totalRent, ar)} rtl={!!isRTL} />
                    <Row label={ar ? 'المحصل' : 'Collected'} value={fmtMoney(p.totalCollected, ar)} rtl={!!isRTL} tone="ok" />
                    <Row label={ar ? 'المتبقي' : 'Remaining'} value={fmtMoney(p.totalRemaining, ar)} rtl={!!isRTL} tone={p.totalRemaining > 0 ? 'danger' : 'ok'} />
                    <Row label={ar ? 'المتأخرون' : 'Late tenants'} value={String(p.lateTenantCount)} rtl={!!isRTL} tone={p.lateTenantCount > 0 ? 'danger' : 'ok'} />
                    <Row label={ar ? 'العقود' : 'Contracts'} value={String(p.contractCount)} rtl={!!isRTL} />
                    <Row
                      label={ar ? 'البلاغات' : 'Tickets'}
                      value={p.ticketCount > 0 ? String(p.ticketCount) : 'Requires Source Support'}
                      rtl={!!isRTL}
                      missing={p.ticketCount === 0}
                    />
                    <Row
                      label={ar ? 'آخر تحديث' : 'Last update'}
                      value={p.lastUpdatedMissing ? 'Requires Source Support' : p.lastUpdated.slice(0, 19).replace('T', ' ')}
                      rtl={!!isRTL}
                      missing={p.lastUpdatedMissing}
                    />
                    <Row label={ar ? 'حالة البيانات' : 'Data status'} value={p.dataStatusLabel} rtl={!!isRTL} tone={p.dataStatus === 'confirmed' ? 'ok' : 'warn'} />
                    <Text style={[styles.tapHint, isRTL && styles.rtl]}>
                      {ar ? 'اضغط لعرض الوحدات ←' : 'Tap to open units →'}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          ) : null}

          {tab === 'units' ? (
            <View testID="ops-units-list">
              <Text style={[styles.count, isRTL && styles.rtl]}>
                {visibleUnits.length} {ar ? 'وحدة' : 'units'}
                {selectedProperty ? ` · ${selectedProperty.name}` : ''}
              </Text>
              {visibleUnits.map((u) => (
                <Pressable
                  key={u.id}
                  testID={`ops-unit-${u.id}`}
                  onPress={() => { Haptics.selectionAsync(); setSelectedUnit(u); }}
                  style={{ marginBottom: spacing.sm }}
                >
                  <GlassCard padding={16} radiusToken="lg" edge={u.arrears > 0 ? 'gold' : 'neutral'}>
                    <View style={[styles.unitHead, isRTL && styles.rowRtl]}>
                      <Text style={[styles.title, isRTL && styles.rtl]}>{ar ? 'وحدة' : 'Unit'} {u.number}</Text>
                      <Text style={styles.badge}>{u.unitStatusLabel}</Text>
                    </View>
                    <Text style={[styles.sub, isRTL && styles.rtl]}>{u.propertyName} · {u.tenantName}</Text>
                    <View style={styles.hair} />
                    <Row
                      label={ar ? 'الجوال' : 'Phone'}
                      value={u.phoneMissing ? 'Requires Source Support' : u.phone}
                      rtl={!!isRTL}
                      missing={u.phoneMissing}
                    />
                    <Row
                      label={ar ? 'العقد' : 'Contract'}
                      value={u.contractNumberMissing ? 'Requires Source Support' : u.contractNumber}
                      rtl={!!isRTL}
                      missing={u.contractNumberMissing}
                    />
                    <Row label={ar ? 'الإيجار' : 'Rent'} value={fmtMoney(u.rent, ar)} rtl={!!isRTL} />
                    <Row
                      label={ar ? 'المتأخرات' : 'Arrears'}
                      value={fmtMoney(u.arrears, ar)}
                      rtl={!!isRTL}
                      tone={u.arrears > 0 ? 'danger' : 'ok'}
                    />
                    <Row
                      label={ar ? 'آخر نشاط' : 'Last activity'}
                      value={u.lastActivityMissing ? 'Requires Source Support' : u.lastActivity}
                      rtl={!!isRTL}
                      missing={u.lastActivityMissing}
                    />
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          ) : null}

          {tab === 'imports' ? (
            <View testID="ops-imports-list">
              <Text style={[styles.count, isRTL && styles.rtl]}>
                {batches.length} {ar ? 'دفعة استيراد' : 'import batches'}
              </Text>
              {batches.length === 0 ? (
                <Text style={[styles.sub, isRTL && styles.rtl]}>Requires Source Support</Text>
              ) : (
                batches.map((b) => (
                  <GlassCard key={b.id} padding={14} radiusToken="md" style={{ marginBottom: spacing.sm }} testID={`ops-batch-${b.id}`}>
                    <Text style={[styles.title, isRTL && styles.rtl]}>{b.id}</Text>
                    <Text style={[styles.sub, isRTL && styles.rtl]}>
                      {(b.appliedAt || '').slice(0, 19).replace('T', ' ')} · {b.period || '—'}
                    </Text>
                    <Text style={[styles.sub, isRTL && styles.rtl]}>
                      {ar ? 'وحدات' : 'Units'} {b.counts?.units ?? 0} · {ar ? 'مستأجرون' : 'Tenants'} {b.counts?.tenants ?? 0} · {ar ? 'عقود' : 'Contracts'} {b.counts?.contracts ?? 0} · Ledger {b.counts?.ledgerEntries ?? 0}
                    </Text>
                    <Text style={[styles.sub, isRTL && styles.rtl]}>
                      +{b.changeCounts?.added ?? 0} / ~{b.changeCounts?.updated ?? 0}
                      {b.changeCounts?.conflicts != null ? ` / !${b.changeCounts.conflicts}` : ''}
                    </Text>
                    <Pressable
                      onPress={() => router.push('/operational/payments' as any)}
                      style={{ marginTop: 8 }}
                    >
                      <Text style={styles.link}>{ar ? 'فتح دفتر المدفوعات ←' : 'Open payment ledger →'}</Text>
                    </Pressable>
                  </GlassCard>
                ))
              )}
              <View style={[styles.quickLinks, isRTL && styles.rowRtl]}>
                <Pressable onPress={() => router.push('/tenants' as any)}><Text style={styles.link}>{ar ? 'المستأجرون' : 'Tenants'}</Text></Pressable>
                <Pressable onPress={() => router.push('/contracts' as any)}><Text style={styles.link}>{ar ? 'العقود' : 'Contracts'}</Text></Pressable>
                <Pressable onPress={() => router.push('/operational/payments' as any)}><Text style={styles.link}>{ar ? 'المدفوعات' : 'Payments'}</Text></Pressable>
                <Pressable onPress={() => router.push('/maintenance' as any)}><Text style={styles.link}>{ar ? 'الصيانة' : 'Maintenance'}</Text></Pressable>
              </View>
            </View>
          ) : null}
        </>
      )}

      {/* Unit drill-down: tenant → contract → ledger → maintenance */}
      <Modal visible={!!selectedUnit} animationType="slide" transparent onRequestClose={() => setSelectedUnit(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            <View style={[styles.detailHead, isRTL && styles.rowRtl]}>
              <Text style={[styles.detailTitle, isRTL && styles.rtl]}>
                {ar ? 'الوحدة' : 'Unit'} {selectedUnit?.number}
              </Text>
              <Pressable onPress={() => setSelectedUnit(null)} testID="ops-unit-detail-close">
                <Text style={styles.close}>{ar ? 'إغلاق' : 'Close'}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
              {selectedUnit ? (
                <>
                  <Text style={[styles.section, isRTL && styles.rtl]}>{ar ? 'بطاقة المستأجر' : 'Tenant'}</Text>
                  {selectedUnit.tenant ? (
                    <OperationalTenantCard tenant={selectedUnit.tenant} state={osState} testID="ops-drill-tenant" />
                  ) : (
                    <Text style={styles.muted}>Requires Source Support</Text>
                  )}

                  <Text style={[styles.section, isRTL && styles.rtl]}>{ar ? 'العقد' : 'Contract'}</Text>
                  {(() => {
                    const cv = contractViews.find((c) => c.unitId === selectedUnit.id || c.tenantId === selectedUnit.tenantId);
                    return cv ? (
                      <OperationalContractCard view={cv} ar={ar} rtl={!!isRTL} testID="ops-drill-contract" />
                    ) : (
                      <Text style={styles.muted}>Requires Source Support</Text>
                    );
                  })()}

                  <Text style={[styles.section, isRTL && styles.rtl]}>{ar ? 'دفتر الأشهر' : 'Month ledger'}</Text>
                  <GlassCard padding={14} radiusToken="md" testID="ops-drill-ledger">
                    {selectedUnit.ledger.length === 0 ? (
                      <Text style={styles.muted}>Requires Source Support</Text>
                    ) : (
                      selectedUnit.ledger
                        .slice()
                        .sort((a, b) => String(b.monthKey).localeCompare(String(a.monthKey)))
                        .map((L) => (
                          <Text key={L.id} style={[styles.monthLine, isRTL && styles.rtl]}>
                            {L.monthLabel || L.monthKey}: {fmtMoney(L.due, ar)} / {fmtMoney(L.paid, ar)} / {fmtMoney(L.remaining, ar)}
                          </Text>
                        ))
                    )}
                  </GlassCard>
                  <Pressable onPress={() => { setSelectedUnit(null); router.push('/operational/payments' as any); }}>
                    <Text style={[styles.link, { marginTop: 8 }]}>{ar ? 'فتح دفتر المدفوعات الكامل ←' : 'Full payment ledger →'}</Text>
                  </Pressable>

                  <Text style={[styles.section, isRTL && styles.rtl]}>{ar ? 'سجل الصيانة' : 'Maintenance'}</Text>
                  <GlassCard padding={14} radiusToken="md" testID="ops-drill-maintenance">
                    {selectedUnit.tickets.length === 0 ? (
                      <Text style={styles.muted}>Requires Source Support</Text>
                    ) : (
                      selectedUnit.tickets.map((tk) => (
                        <Pressable key={tk.id} onPress={() => { setSelectedUnit(null); router.push(`/maintenance/${tk.id}` as any); }}>
                          <Text style={[styles.monthLine, isRTL && styles.rtl]}>
                            {tk.title} · {tk.status} · {(tk.updatedAt || tk.createdAt || '').slice(0, 10)}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </GlassCard>
                  <Pressable onPress={() => { setSelectedUnit(null); router.push('/maintenance' as any); }}>
                    <Text style={[styles.link, { marginTop: 8 }]}>{ar ? 'شاشة الصيانة ←' : 'Maintenance screen →'}</Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  rowRtl: { flexDirection: 'row-reverse' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  kpiCard: {
    width: '23%',
    flexGrow: 1,
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  kpiLabel: { color: colors.textMuted, fontSize: 9, letterSpacing: 0.4 },
  kpiValue: { color: colors.text, fontSize: 13, fontWeight: typography.weight.semibold, marginTop: 4 },
  chipScroll: { marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipOn: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  chipOnSort: { borderColor: colors.emeraldEdge, backgroundColor: colors.emeraldSoft },
  chipText: { color: colors.textMuted, fontSize: 12 },
  chipTextOn: { color: colors.text, fontWeight: typography.weight.semibold },
  search: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  count: { color: colors.gold, fontSize: 11, letterSpacing: 1, marginBottom: spacing.sm, fontWeight: typography.weight.semibold },
  title: { color: colors.text, fontSize: 16, fontWeight: typography.weight.semibold },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 4 },
  rowLabel: { color: colors.textMuted, fontSize: 12, flex: 1 },
  rowVal: { color: colors.text, fontSize: 12, fontWeight: typography.weight.semibold, flexShrink: 1 },
  tapHint: { color: colors.gold, fontSize: 11, marginTop: 10 },
  unitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: {
    color: colors.text,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  link: { color: colors.gold, fontSize: 13 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  detailSheet: {
    maxHeight: '92%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
  },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  detailTitle: { color: colors.text, fontSize: 16, fontWeight: typography.weight.semibold },
  close: { color: colors.gold, fontSize: 14 },
  section: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: typography.weight.semibold,
  },
  monthLine: { color: colors.textMuted, fontSize: 12, marginBottom: 6 },
  muted: { color: colors.textMuted, fontSize: 13 },
});
