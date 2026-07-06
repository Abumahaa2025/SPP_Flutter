import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { BrainVerdict } from '@/src/components/BrainVerdict';
import { GuidedSetup } from '@/src/components/GuidedSetup';
import { SetupProgressBar } from '@/src/components/SetupProgressBar';
import { api, type TenantT, type PropertyT } from '@/src/api/client';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function Tenants() {
  const { t } = useI18n();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantT[]>([]);
  const [props, setProps] = useState<PropertyT[]>([]);

  useEffect(() => {
    api.tenants().then(setTenants).catch(() => {});
    api.properties().then(setProps).catch(() => {});
  }, []);

  const propMap = useMemo(() => new Map(props.map((p) => [p.id, p])), [props]);

  return (
    <ScreenScaffold testID="tenants-screen">
      <StoryScreenHeader question={t('page.q.tenants')} hint={t('tenants.sub')} showBack testID="tenants-header" />
      <SetupProgressBar compact testID="tenants-setup-progress" />
      <GuidedSetup flowId="tenant" defaultOpen={tenants.length === 0} testID="tenants-guided" />
      <BrainVerdict screen="tenants" />
      {tenants.length === 0 ? (
        <AliveEmpty title={t('alive.tenants.title')} body={t('alive.tenants.body')} />
      ) : tenants.map((tn, i) => {
        const prop = propMap.get(tn.property_id);
        const rel = tn.reliability;
        const color = rel >= 90 ? colors.emerald : rel >= 75 ? colors.gold : colors.warning;
        return (
          <Animated.View key={tn.id} entering={FadeInDown.duration(600).delay(60 * i)}>
            <Pressable
              testID={`tenant-${tn.id}`}
              onPress={() => { Haptics.selectionAsync(); if (prop) router.push(`/property/${prop.id}` as any); }}
              style={{ marginBottom: spacing.md }}
            >
              <GlassCard padding={20} radiusToken="lg">
                <View style={styles.row}>
                  <View style={[styles.avatar, { borderColor: color + '55', backgroundColor: color + '18' }]}>
                    <Text style={[styles.initial, { color }]}>{tn.name.trim()[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{tn.name}</Text>
                    <Text style={styles.property}>{prop?.name ?? ''} · {t('tenants.unit')} {tn.unit}</Text>
                  </View>
                  <View style={styles.relWrap}>
                    <Text style={[styles.rel, { color }]}>{tn.reliability}</Text>
                    <Text style={styles.relLabel}>{t('tenants.relShort').toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.hair} />
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('tenants.since')}</Text>
                    <Text style={styles.metaValue}>{new Date(tn.since).getFullYear()}</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('tenants.rent')}</Text>
                    <Text style={styles.metaValue}>AED {(tn.rent / 1000).toFixed(1)}K</Text>
                  </View>
                  <View style={styles.metaSep} />
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>{t('tenants.reliability')}</Text>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { width: `${tn.reliability}%`, backgroundColor: color }]} />
                    </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  initial: { fontSize: 16, fontWeight: typography.weight.semibold, letterSpacing: -0.3 },
  name: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: -0.2 },
  property: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  relWrap: { alignItems: 'flex-end' },
  rel: { fontSize: 22, fontWeight: typography.weight.semibold, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  relLabel: { color: colors.textSubtle, fontSize: 9, letterSpacing: 1.4, marginTop: -2 },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginTop: 16 },
  metaRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center', gap: 12 },
  metaCol: { flex: 1 },
  metaSep: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: colors.divider },
  metaLabel: { color: colors.textMuted, fontSize: 9.5, letterSpacing: 1.4, fontWeight: typography.weight.medium },
  metaValue: { color: colors.text, fontSize: 14, marginTop: 4, fontWeight: typography.weight.semibold, letterSpacing: -0.1, fontVariant: ['tabular-nums'] },
  bar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 8, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});
