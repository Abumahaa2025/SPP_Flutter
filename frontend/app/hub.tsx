import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Tile = {
  key: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  titleKey: any;
  subKey: any;
  accent?: 'gold' | 'emerald' | 'neutral';
};

export default function Hub() {
  const { t } = useI18n();
  const router = useRouter();

  const sections: { key: string; titleKey: any; tiles: Tile[] }[] = [
    {
      key: 'ai',
      titleKey: 'hub.section.ai',
      tiles: [
        { key: 'brain', route: '/brain', icon: 'message-circle', titleKey: 'hub.tile.brain', subKey: 'hub.tile.brain.sub', accent: 'gold' },
        { key: 'decisions', route: '/', icon: 'target', titleKey: 'hub.tile.decisions', subKey: 'hub.tile.decisions.sub', accent: 'gold' },
        { key: 'health', route: '/health', icon: 'heart', titleKey: 'hub.tile.health', subKey: 'hub.tile.health.sub', accent: 'emerald' },
        { key: 'maintenance', route: '/maintenance', icon: 'tool', titleKey: 'hub.tile.maintenance', subKey: 'hub.tile.maintenance.sub' },
        { key: 'sensors', route: '/sensors', icon: 'activity', titleKey: 'hub.tile.sensors', subKey: 'hub.tile.sensors.sub' },
      ],
    },
    {
      key: 'assets',
      titleKey: 'hub.section.assets',
      tiles: [
        { key: 'portfolio', route: '/portfolio', icon: 'grid', titleKey: 'hub.tile.portfolio', subKey: 'hub.tile.portfolio.sub' },
        { key: 'tenants', route: '/tenants', icon: 'users', titleKey: 'hub.tile.tenants', subKey: 'hub.tile.tenants.sub' },
        { key: 'contracts', route: '/contracts', icon: 'file-text', titleKey: 'hub.tile.contracts', subKey: 'hub.tile.contracts.sub' },
        { key: 'owner', route: '/owner', icon: 'user', titleKey: 'hub.tile.owner', subKey: 'hub.tile.owner.sub' },
      ],
    },
    {
      key: 'ops',
      titleKey: 'hub.section.ops',
      tiles: [
        { key: 'reports', route: '/reports', icon: 'file', titleKey: 'hub.tile.reports', subKey: 'hub.tile.reports.sub', accent: 'gold' },
        { key: 'notifications', route: '/notifications', icon: 'bell', titleKey: 'hub.tile.notifications', subKey: 'hub.tile.notifications.sub' },
        { key: 'settings', route: '/settings', icon: 'settings', titleKey: 'hub.tile.settings', subKey: 'hub.tile.settings.sub' },
      ],
    },
    {
      key: 'grow',
      titleKey: 'hub.section.grow',
      tiles: [
        { key: 'knowledge', route: '/knowledge', icon: 'book-open', titleKey: 'hub.tile.knowledge', subKey: 'hub.tile.knowledge.sub' },
        { key: 'guides', route: '/guides', icon: 'play-circle', titleKey: 'hub.tile.guides', subKey: 'hub.tile.guides.sub', accent: 'emerald' },
      ],
    },
  ];

  let idx = 0;
  return (
    <ScreenScaffold testID="hub-screen" contentStyle={{ paddingBottom: 220 }}>
      <ScreenHeader
        eyebrow={t('nav.hub')}
        title={t('hub.title')}
        sub={t('hub.sub')}
        showBack
      />
      {sections.map((section) => (
        <View key={section.key} style={{ marginBottom: spacing.xl }}>
          <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
          <View style={styles.grid}>
            {section.tiles.map((tile) => {
              const i = idx++;
              return (
                <Animated.View
                  key={tile.key}
                  entering={FadeInDown.duration(500).delay(40 * i)}
                  style={styles.item}
                >
                  <Pressable
                    testID={`hub-${tile.key}`}
                    onPress={() => { Haptics.selectionAsync(); router.push(tile.route as any); }}
                  >
                    <GlassCard padding={18} radiusToken="lg" edge={tile.accent ?? 'neutral'}>
                      <View style={styles.tileTop}>
                        <View style={[
                          styles.iconChip,
                          tile.accent === 'gold' && { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
                          tile.accent === 'emerald' && { borderColor: colors.emeraldEdge, backgroundColor: colors.emeraldSoft },
                        ]}>
                          <Feather
                            name={tile.icon}
                            size={16}
                            color={
                              tile.accent === 'gold' ? colors.gold :
                                tile.accent === 'emerald' ? colors.emerald :
                                  colors.textDim
                            }
                          />
                        </View>
                        <Feather name="arrow-up-right" size={13} color={colors.textSubtle} />
                      </View>
                      <Text style={styles.tileTitle}>{t(tile.titleKey)}</Text>
                      <Text style={styles.tileSub}>{t(tile.subKey)}</Text>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      ))}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2.2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: { flexGrow: 1, flexBasis: '46%', maxWidth: '48%' },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconChip: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', justifyContent: 'center',
  },
  tileTitle: {
    color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold,
    letterSpacing: -0.2, marginTop: 18,
  },
  tileSub: {
    color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17,
  },
});
