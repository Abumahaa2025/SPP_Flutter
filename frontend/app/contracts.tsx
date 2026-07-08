import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { SetupProgressBar } from '@/src/components/SetupProgressBar';
import { GuidedSetup } from '@/src/components/GuidedSetup';
import { LocalContractCard } from '@/src/components/LocalSetupCards';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { api, type ContractT, type PropertyT, type TenantT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

import { formatDate } from '@/src/utils/locale';

const statusMeta = (s: string, daysLeft: number, t: (k: any) => string) => {
  if (s === 'expiring' && daysLeft < 0) return { color: colors.danger, key: 'contracts.status.expiredAgo' };
  if (s === 'expiring') return { color: colors.gold, key: 'contracts.status.expiring' };
  if (s === 'renewed') return { color: colors.emerald, key: 'contracts.status.renewed' };
  return { color: colors.emerald, key: 'contracts.status.active' };
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
};

const expiryLabel = (dateStr: string, status: string, t: (k: any) => string) => {
  const days = daysUntil(dateStr);
  if (status === 'expiring' && days < 0) {
    return t('contracts.expiredAgo').replace('{days}', String(Math.abs(days)));
  }
  if (status === 'expiring' && days === 0) return t('contracts.expiresToday');
  if (status === 'expiring' && days > 0) {
    return t('contracts.expiresIn').replace('{days}', String(days));
  }
  if (status === 'active') {
    return t('contracts.activeUntil').replace('{date}', formatDate(dateStr));
  }
  return null;
};

export default function Contracts() {
  const { t } = useI18n();
  const router = useRouter();
  const { countEnabled } = useNotificationPrefs();
  const { state: osState } = usePropertyOS(countEnabled);
  const [contracts, setContracts] = useState<ContractT[]>([]);
  const [tenants, setTenants] = useState<TenantT[]>([]);
  const [props, setProps] = useState<PropertyT[]>([]);

  useEffect(() => {
    api.contracts().then(setContracts).catch(() => {});
    api.tenants().then(setTenants).catch(() => {});
    api.properties().then(setProps).catch(() => {});
  }, []);

  const tenantMap = useMemo(() => new Map(tenants.map((x) => [x.id, x])), [tenants]);
  const propMap = useMemo(() => new Map(props.map((x) => [x.id, x])), [props]);

  const sorted = useMemo(() => {
    const order = { expiring: 0, active: 1, renewed: 2 } as Record<string, number>;
    return contracts.slice().sort((a, b) => {
      const oa = order[a.status] ?? 9;
      const ob = order[b.status] ?? 9;
      if (oa !== ob) return oa - ob;
      return new Date(a.end).getTime() - new Date(b.end).getTime();
    });
  }, [contracts]);

  return (
    <ScreenScaffold testID="contracts-screen">
      <StoryScreenHeader question={t('page.q.contracts')} hint={t('contracts.sub')} showBack testID="contracts-header" />
      <SetupProgressBar compact testID="contracts-setup-progress" />
      <GuidedSetup flowId="tenant" defaultOpen={sorted.length === 0 && osState.contracts.length === 0} testID="contracts-guided" />

      {osState.contracts.length > 0 ? (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={styles.localBadge}>{t('result.localData' as any)}</Text>
          {osState.contracts.map((c) => {
            const tenant = osState.tenants.find((x) => x.id === c.tenantId);
            const unit = osState.units.find((u) => u.id === c.unitId);
            return (
              <LocalContractCard key={c.id} contract={c} tenant={tenant} unit={unit} />
            );
          })}
        </View>
      ) : null}

      {sorted.length === 0 && osState.contracts.length === 0 ? (
        <AliveEmpty title={t('alive.contracts.title')} body={t('alive.contracts.body')} />
      ) : sorted.map((c, i) => {
        const days = daysUntil(c.end);
        const meta = statusMeta(c.status, days, t);
        const tn = tenantMap.get(c.tenant_id);
        const prop = propMap.get(c.property_id);
        const expiry = expiryLabel(c.end, c.status, t);
        const statusText = meta.key === 'contracts.status.expiredAgo'
          ? t('contracts.status.expiredAgo').replace('{days}', String(Math.abs(days)))
          : t(meta.key as 'contracts.status.active');
        return (
          <Animated.View key={c.id} entering={FadeInDown.duration(600).delay(60 * i)}>
            <Pressable
              testID={`contract-${c.id}`}
              onPress={() => { Haptics.selectionAsync(); if (prop) router.push(`/property/${prop.id}` as any); }}
              style={{ marginBottom: spacing.md }}
            >
              <GlassCard padding={22} radiusToken="lg" edge={c.status === 'expiring' ? 'gold' : 'neutral'}>
                <View style={styles.topRow}>
                  <View style={[styles.pill, { borderColor: meta.color + '55', backgroundColor: meta.color + '18' }]}>
                    <View style={[styles.pillDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.pillText, { color: meta.color }]}>{statusText}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  {expiry ? (
                    <Text style={styles.days}>{expiry}</Text>
                  ) : null}
                </View>
                <Text style={styles.title}>{tn?.name ?? prop?.name ?? t('contracts.title')}</Text>
                <Text style={styles.sub}>{prop?.name ?? ''} · {t('contracts.unit')} {tn?.unit ?? '—'}</Text>
                <View style={styles.hair} />
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('contracts.meta.start').toUpperCase()}</Text>
                    <Text style={styles.metaValue}>{new Date(c.start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('contracts.meta.end').toUpperCase()}</Text>
                    <Text style={styles.metaValue}>{new Date(c.end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('contracts.meta.monthly').toUpperCase()}</Text>
                    <Text style={styles.metaValue}>AED {(c.monthly_rent / 1000).toFixed(1)}K</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  localBadge: {
    color: colors.gold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: spacing.sm, fontWeight: typography.weight.semibold,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 10, letterSpacing: 1.4, fontWeight: typography.weight.medium },
  days: {
    color: colors.gold, fontSize: 15, fontWeight: typography.weight.semibold,
    letterSpacing: -0.2, fontVariant: ['tabular-nums'],
  },
  title: { color: colors.text, fontSize: 17, fontWeight: typography.weight.semibold, letterSpacing: -0.3, marginTop: 14 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center', gap: 12 },
  metaCol: { flex: 1 },
  metaSep: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: colors.divider },
  metaLabel: { color: colors.textMuted, fontSize: 9.5, letterSpacing: 1.4, fontWeight: typography.weight.medium },
  metaValue: { color: colors.text, fontSize: 13, marginTop: 4, fontWeight: typography.weight.semibold, letterSpacing: -0.1, fontVariant: ['tabular-nums'] },
});
