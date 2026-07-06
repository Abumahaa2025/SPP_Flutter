import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  testID?: string;
};

export function WizardTextField({
  label, value, onChangeText, placeholder, keyboard = 'default', testID,
}: FieldProps) {
  const { isRTL } = useI18n();
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[styles.label, isRTL && styles.rtl]}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboard}
        style={[styles.input, isRTL && styles.inputRtl]}
      />
    </View>
  );
}

type Option<T extends string> = { value: T; label: string };

type ChipProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
};

export function WizardChipGroup<T extends string>({
  label, options, value, onChange, testID,
}: ChipProps<T>) {
  const { isRTL } = useI18n();
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={[styles.label, isRTL && styles.rtl]}>{label}</Text>
      <View style={[styles.chipRow, isRTL && styles.rowRtl]}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              testID={testID ? `${testID}-${o.value}` : undefined}
              onPress={() => onChange(o.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
};

export function WizardToggle({ label, value, onChange, testID }: ToggleProps) {
  const { isRTL } = useI18n();
  return (
    <Pressable
      testID={testID}
      onPress={() => onChange(!value)}
      style={[styles.toggleRow, isRTL && styles.rowRtl, { marginTop: spacing.sm }]}
    >
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={[styles.toggleLabel, isRTL && styles.rtl]}>{label}</Text>
    </Pressable>
  );
}

type InfoProps = { why: string; example: string };

export function WizardInfoBox({ why, example }: InfoProps) {
  const { t, isRTL } = useI18n();
  return (
    <View style={styles.infoBox}>
      <Text style={[styles.infoLabel, isRTL && styles.rtl]}>{t('pos.wizard.why')}</Text>
      <Text style={[styles.infoText, isRTL && styles.rtl]}>{why}</Text>
      <Text style={[styles.infoLabel, isRTL && styles.rtl, { marginTop: 10 }]}>{t('pos.wizard.example')}</Text>
      <Text style={[styles.infoExample, isRTL && styles.rtl]}>{example}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 0.6, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inputRtl: { textAlign: 'right', writingDirection: 'rtl' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  rowRtl: { flexDirection: 'row-reverse', flexWrap: 'wrap-reverse' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  chipText: { color: colors.textDim, fontSize: 12 },
  chipTextActive: { color: colors.gold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.emeraldSoft, borderColor: colors.emeraldEdge },
  checkMark: { color: colors.emerald, fontSize: 12, fontWeight: typography.weight.bold },
  toggleLabel: { color: colors.textDim, fontSize: 13 },
  infoBox: {
    marginTop: spacing.md, padding: 12, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  infoText: { color: colors.textDim, fontSize: 12.5, lineHeight: 19, marginTop: 4 },
  infoExample: { color: colors.gold, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
