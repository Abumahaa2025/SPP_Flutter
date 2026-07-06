import React from 'react';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { MoreMenu } from '@/src/components/MoreMenu';
import { OperationsPanel } from '@/src/components/OperationsPanel';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { useI18n } from '@/src/i18n';

export default function Hub() {
  const { t } = useI18n();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const dailyMode = Boolean(state.setupCompleted && state.property);

  return (
    <ScreenScaffold testID="hub-screen">
      <StoryScreenHeader
        question={t('more.title')}
        hint={t('more.sub')}
        testID="hub-header"
      />
      {dailyMode ? <OperationsPanel compact delay={40} /> : null}
      <MoreMenu />
    </ScreenScaffold>
  );
}
