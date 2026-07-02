import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { GlassCard } from '@/src/components/GlassCard';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { LoadingOrb } from '@/src/components/LoadingOrb';
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

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

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
    } catch (e: any) {
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

  return (
    <View style={styles.root} testID="brain-screen">
      <StatusBar style="light" />
      <AmbientBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingTop: insets.top + spacing.xl,
            paddingBottom: 220,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          testID="chat-scroll"
        >
          <ScreenHeader
            eyebrow={t('nav.brain')}
            title={t('brain.title')}
            sub={t('brain.subtitle')}
          />

          {messages.length === 0 ? (
            <Animated.View entering={FadeIn.duration(600)} style={styles.emptyWrap}>
              <LoadingOrb size={60} />
              <Text style={styles.emptyText}>
                I remember every property, every decision, every signal.
              </Text>
            </Animated.View>
          ) : null}

          {messages.map((m, i) => (
            <Animated.View
              key={m.id}
              entering={FadeInDown.duration(320).delay(i === messages.length - 1 ? 40 : 0)}
              style={[styles.bubbleRow, m.role === 'user' ? styles.userRow : styles.assistantRow]}
            >
              {m.role === 'assistant' ? (
                <View style={styles.assistantAvatar}>
                  <Feather name="star" size={11} color={colors.gold} />
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
                <Feather name="star" size={11} color={colors.gold} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.thinking}>Thinking…</Text>
              </View>
            </View>
          ) : null}

          {messages.length === 0 ? (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={styles.suggestLabel}>{t('brain.suggest')}</Text>
              {suggestions.map((s, i) => (
                <Animated.View key={s} entering={FadeInDown.duration(500).delay(120 + i * 80)}>
                  <Pressable
                    testID={`suggest-${i}`}
                    onPress={() => send(s)}
                    style={{ marginTop: 10 }}
                  >
                    <GlassCard padding={16} radiusToken="md">
                      <View style={styles.suggestRow}>
                        <Text style={styles.suggestText}>{s}</Text>
                        <Feather name="arrow-up-right" size={14} color={colors.textDim} />
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.inputWrap,
            { bottom: 96 + insets.bottom },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.inputBar}>
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
                (!text.trim() || sending) && { opacity: 0.4 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="arrow-up" size={16} color={colors.bg} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <GlassTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: { alignItems: 'center', gap: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg },
  emptyText: {
    color: colors.textMuted, textAlign: 'center', fontSize: typography.body,
    lineHeight: 22, maxWidth: 280,
  },
  suggestLabel: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
    marginBottom: 6,
  },
  suggestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  suggestText: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },

  bubbleRow: { flexDirection: 'row', gap: 10, marginTop: spacing.md, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    backgroundColor: colors.goldSoft, borderColor: colors.goldEdge,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  userText: { color: colors.text, fontSize: 14.5, lineHeight: 21 },
  assistantText: { color: colors.textDim, fontSize: 14.5, lineHeight: 22 },
  thinking: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },

  inputWrap: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(6,11,20,0.85)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingLeft: 20, paddingRight: 6, paddingVertical: 6,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  input: {
    flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
});
