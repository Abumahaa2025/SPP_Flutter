import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { GlassCard } from '@/src/components/GlassCard';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { BrandOrb } from '@/src/components/BrandOrb';
import { api, type ChatMsg } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const SESSION_ID = 'owner_1';

export default function Brain() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.chatHistory(SESSION_ID).then(setMessages).catch(() => {});
  }, []);

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (raw?: string) => {
    const body = (raw ?? text).trim();
    if (!body || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    const now = new Date().toISOString();
    const optimistic: ChatMsg = { id: `local-${Date.now()}`, role: 'user', text: body, at: now };
    setMessages((m) => [...m, optimistic]);
    scrollToEnd();
    setSending(true);
    try {
      const r = await api.chatSend(SESSION_ID, body);
      const reply: ChatMsg = { id: `a-${Date.now()}`, role: 'assistant', text: r.reply, at: r.at };
      setMessages((m) => [...m, reply]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      const reply: ChatMsg = {
        id: `err-${Date.now()}`, role: 'assistant',
        text: 'I couldn\u2019t reach the Brain just now. Try again in a moment.',
        at: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const suggestions = [t('brain.q1'), t('brain.q2'), t('brain.q3'), t('brain.q4')];
  const isEmpty = messages.length === 0;

  return (
    <View style={styles.root} testID="brain-screen">
      <StatusBar style="light" />
      <AmbientBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingTop: insets.top + spacing.xl,
            paddingBottom: 240,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          testID="chat-scroll"
        >
          {isEmpty ? (
            <>
              {/* Ambient emotional entry */}
              <Animated.View entering={FadeIn.duration(700)} style={styles.emptyHero}>
                <View style={styles.orbBed}>
                  <BrandOrb size={72} />
                </View>
                <Animated.Text entering={FadeInDown.duration(700).delay(150)} style={styles.emptyTitle}>
                  {t('brain.empty.title')}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.duration(700).delay(250)} style={styles.emptyBody}>
                  {t('brain.empty.body')}
                </Animated.Text>
              </Animated.View>

              <View style={styles.suggestBlock}>
                <Text style={styles.suggestLabel}>{t('brain.suggest').toUpperCase()}</Text>
                {suggestions.map((s, i) => (
                  <Animated.View key={s} entering={FadeInDown.duration(500).delay(350 + i * 90)}>
                    <Pressable
                      testID={`suggest-${i}`}
                      onPress={() => send(s)}
                      style={{ marginTop: 10 }}
                    >
                      <GlassCard padding={16} radiusToken="md">
                        <View style={styles.suggestRow}>
                          <View style={styles.suggestDot} />
                          <Text style={styles.suggestText}>{s}</Text>
                          <Feather name="arrow-up-right" size={14} color={colors.textMuted} />
                        </View>
                      </GlassCard>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </>
          ) : (
            <ScreenHeader
              eyebrow={t('nav.brain')}
              title={t('brain.title')}
              sub={t('brain.subtitle')}
            />
          )}

          {messages.map((m, i) => (
            <Animated.View
              key={m.id}
              entering={FadeInUp.duration(320).delay(i === messages.length - 1 ? 40 : 0)}
              style={[styles.bubbleRow, m.role === 'user' ? styles.userRow : styles.assistantRow]}
            >
              {m.role === 'assistant' ? (
                <View style={styles.assistantAvatar}>
                  <Feather name="star" size={10} color={colors.gold} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={m.role === 'user' ? styles.userText : styles.assistantText}>
                  {m.text}
                </Text>
              </View>
            </Animated.View>
          ))}

          {sending ? (
            <View style={[styles.bubbleRow, styles.assistantRow]}>
              <View style={styles.assistantAvatar}>
                <Feather name="star" size={10} color={colors.gold} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <TypingDots />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[styles.inputWrap, { bottom: 100 + insets.bottom }]}
          pointerEvents="box-none"
        >
          <View style={styles.inputBar}>
            <View style={styles.inputDot} />
            <TextInput
              testID="chat-input"
              value={text}
              onChangeText={setText}
              placeholder={t('brain.placeholder')}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              editable={!sending}
            />
            <Pressable
              testID="chat-send"
              disabled={!text.trim() || sending}
              onPress={() => send()}
              style={({ pressed }) => [
                styles.sendBtn,
                (!text.trim() || sending) && { opacity: 0.35 },
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Feather name="arrow-up" size={15} color={colors.bg} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <GlassTabBar />
    </View>
  );
}

/** 3-dot typing indicator, gently pulsing. */
function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          entering={FadeIn.duration(300).delay(i * 100)}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted, opacity: 0.6 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  emptyHero: {
    alignItems: 'center', gap: spacing.md,
    marginTop: spacing.lg, marginBottom: spacing.xl,
  },
  orbBed: { marginBottom: spacing.sm },
  emptyTitle: {
    color: colors.text, fontSize: 26, letterSpacing: -0.6,
    fontWeight: typography.weight.semibold, textAlign: 'center',
  },
  emptyBody: {
    color: colors.textMuted, fontSize: 14, lineHeight: 21,
    textAlign: 'center', maxWidth: 300,
  },
  suggestBlock: { marginTop: spacing.lg },
  suggestLabel: {
    color: colors.textMuted, fontSize: 10, letterSpacing: 2.2,
    fontWeight: typography.weight.medium, paddingLeft: 4,
  },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  suggestDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
  },
  suggestText: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },

  bubbleRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 15, paddingVertical: 11,
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    backgroundColor: 'rgba(212,175,55,0.09)', borderColor: colors.goldEdge,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.035)', borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  userText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  assistantText: { color: colors.textDim, fontSize: 14, lineHeight: 21 },

  inputWrap: {
    position: 'absolute', left: spacing.md + 4, right: spacing.md + 4,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(6,11,20,0.88)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingLeft: 18, paddingRight: 6, paddingVertical: 5,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 }, elevation: 14,
  },
  inputDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: colors.emerald,
    shadowColor: colors.emerald, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
