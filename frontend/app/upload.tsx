import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { UploadMagic, UploadFoundHeader } from '@/src/components/UploadMagic';
import { UploadResultCard, type UploadResult } from '@/src/components/UploadResultCard';
import { GuidedSetup } from '@/src/components/GuidedSetup';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { analyzePickedFiles, buildUploadFileMeta } from '@/src/utils/upload-analyze';
import {
  fetchPortfolioAnalysis,
  fetchPortfolioAnalysisFallback,
  applyPortfolioAnalysis,
  type PortfolioAnalysis,
} from '@/src/api/portfolio-analysis';
import { UploadExecutiveReport } from '@/src/components/UploadExecutiveReport';
import { UploadPortfolioPrompt } from '@/src/components/UploadPortfolioPrompt';
import { UploadSmartDecisions } from '@/src/components/UploadSmartDecisions';
import { UploadNextActions } from '@/src/components/UploadNextActions';
import { storage } from '@/src/utils/storage';
import { UX_BUILD_STAMP } from '@/src/constants/build';
import { apiUrl } from '@/src/constants/backend';

type Picked = { name: string; mimeType?: string; size?: number; uri?: string };

const MAGIC_PHASE_MS = 520;

export default function UploadScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [files, setFiles] = useState<Picked[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [promptDone, setPromptDone] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<'render' | 'fallback' | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const pickFiles = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/*',
      ],
    });
    if (res.canceled || !res.assets?.length) return;
    const next: Picked[] = res.assets.map((a) => ({
      name: a.name,
      mimeType: a.mimeType ?? undefined,
      size: a.size ?? undefined,
      uri: a.uri,
    }));
    setFiles((prev) => [...prev, ...next]);
    setResults([]);
    setPortfolioAnalysis(null);
    setPromptDone(false);
    setAnalysisSource(null);
    setAnalysisError(null);
    setStep(1);
  }, []);

  const removeFile = (name: string) => {
    Haptics.selectionAsync();
    setFiles((prev) => {
      const next = prev.filter((f) => f.name !== name);
      if (!next.length) setStep(1);
      return next;
    });
    setResults([]);
    setPortfolioAnalysis(null);
    setPromptDone(false);
    setAnalysisSource(null);
    setAnalysisError(null);
  };

  const runAnalysis = async () => {
    if (!files.length || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true);
    setResults([]);
    setPortfolioAnalysis(null);
    setPromptDone(false);
    setAnalysisSource(null);
    setAnalysisError(null);
    setStep(2);
    try {
      for (let s = 2; s <= 6; s++) {
        setStep(s);
        await new Promise((r) => setTimeout(r, MAGIC_PHASE_MS));
      }
      const fileMeta = await buildUploadFileMeta(files);
      const analyzed = await analyzePickedFiles(files, lang);
      let portfolio: PortfolioAnalysis;
      try {
        portfolio = await fetchPortfolioAnalysis(fileMeta);
        setAnalysisSource('render');
        setAnalysisError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'analysis failed';
        setAnalysisError(msg);
        portfolio = await fetchPortfolioAnalysisFallback(fileMeta, lang);
        setAnalysisSource('fallback');
      }
      setResults(analyzed);
      setPortfolioAnalysis(portfolio);
      await storage.setItem('spp.lastPortfolioAnalysis', JSON.stringify(portfolio));
      setStep(7);
    } catch {
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const onPromptChoice = async (key: 'update' | 'review' | 'cancel') => {
    if (!portfolioAnalysis) return;
    if (key === 'update') {
      try {
        await applyPortfolioAnalysis(portfolioAnalysis.analysis_id);
      } catch { /* beta — local flow continues */ }
      router.push('/portfolio');
    } else if (key === 'cancel') {
      setPortfolioAnalysis(null);
      setResults([]);
      setFiles([]);
      setStep(1);
      return;
    }
    setPromptDone(true);
  };

  return (
    <ScreenScaffold testID="upload-screen">
      <StoryScreenHeader
        question={t('page.q.upload')}
        hint={t('upload.sub')}
        testID="upload-header"
      />

      {__DEV__ ? (
        <View style={styles.buildBar} testID="upload-build-stamp">
          <Text style={styles.buildStamp}>{UX_BUILD_STAMP}</Text>
          <Text style={styles.apiHint} numberOfLines={1}>
            API: {apiUrl('/upload/portfolio-analysis').replace('https://', '')}
          </Text>
        </View>
      ) : null}

      {analysisSource ? (
        <View style={[styles.sourceBadge, analysisSource === 'render' ? styles.sourceRender : styles.sourceFallback]}>
          <Text style={styles.sourceText}>
            {analysisSource === 'render' ? t('upload.source.render') : t('upload.source.fallback')}
          </Text>
        </View>
      ) : null}
      {analysisError && analysisSource === 'fallback' ? (
        <Text style={styles.errorHint} numberOfLines={2}>{analysisError}</Text>
      ) : null}

      <GuidedSetup flowId="pdf" defaultOpen={files.length === 0} testID="upload-guided" />

      {!busy && !results.length ? (
        <Animated.View entering={FadeInDown.duration(600).delay(80)} style={styles.dropZone}>
          <Pressable onPress={pickFiles} style={styles.dropInner} testID="upload-pick-btn">
            <Feather name="upload-cloud" size={36} color={colors.gold} />
            <Text style={styles.dropTitle}>{t('upload.magicTitle')}</Text>
            <View style={styles.chips}>
              {(['pdf', 'excel', 'image', 'contract', 'invoice', 'receipt', 'whatsapp'] as const).map((k) => (
                <View key={k} style={styles.chip}>
                  <Text style={styles.chipText}>{t(`upload.type.${k}`)}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {files.length > 0 && !results.length ? (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.fileBlock}>
          {files.map((f) => (
            <View key={f.name} style={styles.fileRow}>
              <Feather name="file" size={14} color={colors.textMuted} />
              <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
              {!busy ? (
                <Pressable onPress={() => removeFile(f.name)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {!busy ? (
            <View style={styles.actions}>
              <Pressable onPress={pickFiles} style={styles.secondaryBtn} testID="upload-add-more">
                <Text style={styles.secondaryText}>{t('upload.addMore')}</Text>
              </Pressable>
              <Pressable
                onPress={runAnalysis}
                style={styles.primaryBtn}
                testID="upload-analyze-btn"
              >
                <Feather name="zap" size={15} color={colors.bg} />
                <Text style={styles.primaryText}>{t('upload.analyze')}</Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {busy || results.length > 0 ? (
        <UploadMagic step={step} done={results.length > 0} />
      ) : null}

      {results.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(600)}>
          <UploadFoundHeader />
          {portfolioAnalysis ? (
            <>
              <UploadExecutiveReport analysis={portfolioAnalysis} />
              {!promptDone ? (
                <UploadPortfolioPrompt analysis={portfolioAnalysis} onChoice={onPromptChoice} />
              ) : (
                <>
                  <UploadSmartDecisions decisions={portfolioAnalysis.smart_decisions} />
                  <UploadNextActions
                    actions={portfolioAnalysis.next_actions}
                    message={portfolioAnalysis.what_now_message}
                  />
                </>
              )}
            </>
          ) : null}
          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            {results.map((r, i) => (
              <Animated.View key={r.id} entering={FadeInDown.duration(500).delay(120 + i * 100)}>
                <UploadResultCard
                  result={r}
                  testID={`upload-result-${r.id}`}
                  onApprove={() => router.push('/portfolio')}
                  onAsk={() => router.push({ pathname: '/brain', params: { q: r.summary } } as any)}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  dropZone: {
    marginTop: spacing.xl, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.goldEdge, borderStyle: 'dashed',
    backgroundColor: colors.goldSoft,
  },
  dropInner: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.lg, gap: 14 },
  dropTitle: { color: colors.text, fontSize: 22, fontWeight: typography.weight.semibold, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: { color: colors.textDim, fontSize: 11 },
  fileBlock: {
    marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  fileName: { flex: 1, color: colors.text, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center',
  },
  secondaryText: { color: colors.textDim, fontSize: 13, fontWeight: typography.weight.medium },
  primaryBtn: {
    flex: 2, flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: radius.pill,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { color: colors.bg, fontSize: 14, fontWeight: typography.weight.semibold },
  buildBar: {
    marginTop: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
  },
  buildStamp: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  apiHint: { color: colors.textSubtle, fontSize: 9, marginTop: 4, letterSpacing: 0.2 },
  sourceBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sourceRender: { backgroundColor: colors.emeraldSoft, borderColor: colors.emeraldEdge },
  sourceFallback: { backgroundColor: colors.goldSoft, borderColor: colors.goldEdge },
  sourceText: { fontSize: 10, fontWeight: typography.weight.medium, color: colors.text },
  errorHint: { color: colors.textMuted, fontSize: 10, marginTop: 6, lineHeight: 14 },
});
