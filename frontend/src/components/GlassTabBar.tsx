import React from 'react';

import { View, StyleSheet, Pressable, Platform, Text } from 'react-native';

import { BlurView } from 'expo-blur';

import { Feather } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import Animated, { FadeIn } from 'react-native-reanimated';

import { useRouter, usePathname } from 'expo-router';

import { colors, radius, spacing, typography } from '../theme';

import { useI18n } from '../i18n';



type Tab = {

  key: string;

  path: string;

  icon: keyof typeof Feather.glyphMap;

  tKey: string;

  center?: boolean;

};



export const SPP_TABS: Tab[] = [

  { key: 'home', path: '/', icon: 'home', tKey: 'nav.os.home' },

  { key: 'notifications', path: '/notifications', icon: 'bell', tKey: 'nav.os.notifications' },

  { key: 'assistant', path: '/brain', icon: 'mic', tKey: 'nav.os.assistant', center: true },

  { key: 'upload', path: '/upload', icon: 'upload-cloud', tKey: 'nav.os.upload' },

  { key: 'more', path: '/hub', icon: 'more-horizontal', tKey: 'nav.os.more' },

];



export function GlassTabBar() {

  const router = useRouter();

  const pathname = usePathname() || '/';

  const { t } = useI18n();

  const active =

    SPP_TABS.find((tab) => (tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path)))?.key

    ?? 'home';



  return (

    <View style={styles.wrap} pointerEvents="box-none">

      <View style={styles.shadow}>

        <BlurView intensity={Platform.OS === 'android' ? 30 : 80} tint="dark" style={styles.bar}>

          <View style={styles.highlight} />

          <View style={styles.inner}>

            {SPP_TABS.map((tab) => {

              const isActive = tab.key === active;

              const isCenter = tab.center;

              return (

                <Pressable

                  key={tab.key}

                  testID={`tab-${tab.key}`}

                  onPress={() => {

                    Haptics.selectionAsync();

                    router.replace(tab.path as any);

                  }}

                  style={[styles.item, isCenter && styles.itemCenter]}

                  hitSlop={6}

                >

                  <View style={[isCenter && styles.centerOrb, isCenter && isActive && styles.centerOrbActive]}>

                    <Feather

                      name={tab.icon}

                      size={isCenter ? 22 : 18}

                      color={isActive ? colors.gold : colors.textMuted}

                      style={{ opacity: isActive ? 1 : 0.75 }}

                    />

                  </View>

                  <Text style={[styles.label, isActive && styles.labelActive, isCenter && styles.labelCenter]} numberOfLines={1}>

                    {t(tab.tKey as 'nav.os.home')}

                  </Text>

                  {isActive && !isCenter

                    ? <Animated.View entering={FadeIn.duration(220)} style={styles.dot} />

                    : <View style={styles.dotHidden} />}

                </Pressable>

              );

            })}

          </View>

        </BlurView>

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.md + 4, alignItems: 'center' },

  shadow: {

    width: '100%', borderRadius: radius.lg, overflow: 'hidden',

    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',

    backgroundColor: 'rgba(6,11,20,0.6)',

    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 32,

    shadowOffset: { width: 0, height: 22 }, elevation: 22,

  },

  bar: { width: '100%' },

  highlight: { position: 'absolute', left: 28, right: 28, top: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)' },

  inner: { flexDirection: 'row', paddingHorizontal: 4, paddingTop: 10, paddingBottom: 10, alignItems: 'flex-end' },

  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 0 },

  itemCenter: { marginTop: -12 },

  centerOrb: {

    width: 48, height: 48, borderRadius: 24,

    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,

    backgroundColor: colors.goldSoft,

    alignItems: 'center', justifyContent: 'center',

    shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },

    elevation: 8,

  },

  centerOrbActive: {

    borderColor: colors.gold,

    backgroundColor: 'rgba(212,175,55,0.18)',

  },

  label: {

    color: colors.textMuted, fontSize: 9, letterSpacing: 0.2,

    fontWeight: typography.weight.medium, textAlign: 'center',

  },

  labelCenter: { color: colors.gold, fontSize: 9, fontWeight: typography.weight.semibold },

  labelActive: { color: colors.gold },

  dot: {

    width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold,

    shadowColor: colors.gold, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,

  },

  dotHidden: { width: 4, height: 4 },

});

