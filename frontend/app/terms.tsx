import React from 'react';
import { LegalScreen } from '@/src/components/LegalScreen';

export default function Terms() {
  return (
    <LegalScreen
      testID="terms-screen"
      eyebrow="Legal"
      doc={{
        title: 'Terms of Service',
        sub: 'The rules that govern your use of SPP.',
        sections: [
          { h: 'Acceptance', p: 'By using SPP you agree to these terms. If you do not agree, please discontinue use.' },
          { h: 'Service', p: 'SPP provides AI-powered decision support for property owners. Recommendations are advisory and never a substitute for professional judgment.' },
          { h: 'Subscription', p: 'Paid plans renew automatically unless cancelled. You can cancel any time in Settings \u2192 Subscription.' },
          { h: 'Acceptable use', p: 'Do not reverse-engineer, resell, or use SPP to violate applicable laws. Automated scraping is not permitted.' },
          { h: 'Limitation of liability', p: 'SPP is provided \u201cas is\u201d. To the maximum extent permitted, we are not liable for indirect or consequential damages.' },
          { h: 'Termination', p: 'We may suspend or terminate accounts that violate these terms. You can terminate at any time.' },
          { h: 'Governing law', p: 'These terms are governed by the laws of the United Arab Emirates.' },
        ],
      }}
    />
  );
}
