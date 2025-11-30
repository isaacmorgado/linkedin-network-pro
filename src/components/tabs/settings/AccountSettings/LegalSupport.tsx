/**
 * Legal & Support Section Component
 */

import { Info } from 'lucide-react';
import { Section, TextLink } from '../components';

interface LegalSupportProps {
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function LegalSupport({
  accentColor,
  backgroundColor,
  textColor,
}: LegalSupportProps) {
  return (
    <Section
      title="Legal & Support"
      icon={<Info size={18} />}
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      textColor={textColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <TextLink label="Privacy Policy" href="https://uproot.app/privacy" accentColor={accentColor} />
        <TextLink label="Terms of Service" href="https://uproot.app/terms" accentColor={accentColor} />
        <TextLink label="Help & Support" href="https://uproot.app/support" accentColor={accentColor} />
        <TextLink
          label="Report a Bug"
          href="https://github.com/your-repo/issues/new"
          accentColor={accentColor}
        />
      </div>
    </Section>
  );
}
