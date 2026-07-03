import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { EmptyState } from '@/src/components/EmptyState';
import { BrainVerdict } from '@/src/components/BrainVerdict';
import { api, type ContractT, type PropertyT, type TenantT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const statusMeta = (s: string) => {
  if (s === 'expiring') return { color: colors.gold, key: 'contracts.status.expiring' };
  if (s === 'renewed') return { color: colors.emerald, key: 'contracts.status.renewed' };
  return { color: colors.emerald, key: 'contracts.status.active' };
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((d - now) / (1000 * 60 * 60 * 24)));
};

export default function Contracts() {
  const { t } = useI18n();
  const router = useRouter();
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

  return (
    <ScreenScaffold testID="contracts-screen">
      <ScreenHeader eyebrow="Lifecycle" title={t('contracts.title')} sub={t('contracts.sub')} showBack />
      <BrainVerdict screen="contracts" />
      {contracts.length === 0 ? (
        <EmptyState icon="file-text" title="No contracts yet." />
      ) : contracts.map((c, i) => {
        const meta = statusMeta(c.status);
        const tn = tenantMap.get(c.tenant_id);
        const prop = propMap.get(c.property_id);
        const days = daysUntil(c.end);
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
                    <Text style={[styles.pillText, { color: meta.color }]}>{t(meta.key as any).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  {c.status === 'expiring' ? (
                    <Text style={styles.days}>{days}d</Text>
                  ) : null}
                </View>
                <Text style={styles.title}>{tn?.name ?? 'Tenant'}</Text>
                <Text style={styles.sub}>{prop?.name ?? ''} · Unit {tn?.unit ?? '—'}</Text>
                <View style={styles.hair} />
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>START</Text>
                    <Text style={styles.metaValue}>{new Date(c.start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>END</Text>
                    <Text style={styles.metaValue}>{new Date(c.end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>MONTHLY</Text>
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
