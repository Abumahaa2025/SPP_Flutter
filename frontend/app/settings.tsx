import React from 'react';
import { View, Text, StyleSheet, Pressable, I18nManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { storage } from '@/src/utils/storage';

export default function Settings() {
  const { t, lang, setLang } = useI18n();

  const changeLang = async (l: 'en' | 'ar') => {
    Haptics.selectionAsync();
    await storage.setItem('spp.lang', l);
    setLang(l);
    // If RTL toggled, ask user to relaunch (RN limitation).
  };

  return (
    <ScreenScaffold testID="settings-screen">
      <ScreenHeader
        eyebrow="Preferences"
        title={t('settings.title')}
        sub={t('settings.sub')}
        showBack
      />

      {/* Language */}
      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.section}>{t('settings.language')}</Text>
          <View style={styles.langRow}>
            <LangBtn active={lang === 'en'} label="English" hint="LTR" onPress={() => changeLang('en')} testID="lang-en" />
            <LangBtn active={lang === 'ar'} label="العربية" hint="RTL" onPress={() => changeLang('ar')} testID="lang-ar" />
          </View>
          {I18nManager.isRTL !== (lang === 'ar') ? (
            <Text style={styles.hint}>
              Layout direction will finalize on next app launch.
            </Text>
          ) : null}
        </GlassCard>
      </Animated.View>

      {/* Appearance */}
      <Animated.View entering={FadeInDown.duration(650).delay(100)} style={{ marginTop: spacing.md }}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.section}>{t('settings.appearance')}</Text>
          <Row icon="moon" label="Theme" value="Dark Luxury" />
          <Divider />
          <Row icon="type" label="Font" value="System" />
        </GlassCard>
      </Animated.View>

      {/* Brain */}
      <Animated.View entering={FadeInDown.duration(650).delay(180)} style={{ marginTop: spacing.md }}>
        <GlassCard padding={22} radiusToken="lg" edge="emerald">
          <Text style={styles.section}>{t('settings.brain')}</Text>
          <Row icon="cpu" label="Model" value="GPT-5.2" accent />
          <Divider />
          <Row icon="shield" label="Memory" value="Portfolio-wide" />
          <Divider />
          <Row icon="link" label="Emergent Key" value="Active" accent />
        </GlassCard>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SPP · v1.0 · Smart Property Platform</Text>
      </View>
    </ScreenScaffold>
  );
}

function LangBtn({ active, label, hint, onPress, testID }: { active: boolean; label: string; hint: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.langBtn, active && styles.langBtnActive]}
    >
      <Text style={[styles.langBtnLabel, active && { color: colors.gold }]}>{label}</Text>
      <Text style={styles.langBtnHint}>{hint}</Text>
    </Pressable>
  );
}

function Row({ icon, label, value, accent }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={14} color={accent ? colors.gold : colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.rowValue, accent && { color: colors.gold }]}>{value}</Text>
    </View>
  );
}
function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  section: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium, marginBottom: 14,
  },
  langRow: { flexDirection: 'row', gap: spacing.md },
  langBtn: {
    flex: 1, padding: 18, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  langBtnActive: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  langBtnLabel: { color: colors.text, fontSize: 16, fontWeight: typography.weight.semibold },
  langBtnHint: { color: colors.textSubtle, fontSize: 11, marginTop: 4, letterSpacing: 1.2 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLabel: { color: colors.text, fontSize: 14 },
  rowValue: { color: colors.textDim, fontSize: 13.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  footer: { alignItems: 'center', marginTop: spacing['2xl'] },
  footerText: { color: colors.textSubtle, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
});
