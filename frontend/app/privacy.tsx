import React from 'react';
import { LegalScreen } from '@/src/components/LegalScreen';

export default function Privacy() {
  return (
    <LegalScreen
      testID="privacy-screen"
      eyebrow="Legal"
      doc={{
        title: 'Privacy Policy',
        sub: 'What we collect, how we use it, and how we protect it.',
        sections: [
          { h: 'What we collect', p: 'Portfolio configuration, sensor readings, decisions you approve, and messages with the Unified Brain. We never sell your data.' },
          { h: 'How we use it', p: 'To generate recommendations, predict maintenance, and improve the Brain\u2019s reasoning for your account only.' },
          { h: 'Storage & encryption', p: 'Data is encrypted at rest and in transit. Only your organization can access it. Backups are retained for 30 days.' },
          { h: 'AI model access', p: 'Portfolio data is sent to the configured LLM provider (default: OpenAI GPT-5.2) solely to produce responses to your prompts.' },
          { h: 'Your rights', p: 'You can export or delete your data at any time from Settings \u2192 Privacy \u2192 Data controls. Deletion is permanent within 7 days.' },
          { h: 'Contact', p: 'privacy@spp.ai for any question about how your data is handled.' },
        ],
      }}
    />
  );
}
