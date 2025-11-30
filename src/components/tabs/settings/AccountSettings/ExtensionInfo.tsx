/**
 * Extension Info Section Component
 */

import { Info } from 'lucide-react';
import { Section, InfoRow } from '../components';
import type { StorageUsage } from './types';

interface ExtensionInfoProps {
  extensionVersion: string;
  storageUsage: StorageUsage;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function ExtensionInfo({
  extensionVersion,
  storageUsage,
  accentColor,
  backgroundColor,
  textColor,
}: ExtensionInfoProps) {
  return (
    <Section
      title="Extension Info"
      icon={<Info size={18} />}
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      textColor={textColor}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <InfoRow label="Version" value={`v${extensionVersion}`} textColor={textColor} />
        <InfoRow
          label="Storage Used"
          value={`${(storageUsage.used / 1024).toFixed(1)} KB / ${(
            storageUsage.total / 1024
          ).toFixed(0)} KB`}
          textColor={textColor}
        />
        <InfoRow
          label="Storage %"
          value={`${((storageUsage.used / storageUsage.total) * 100).toFixed(1)}%`}
          textColor={textColor}
        />
      </div>
    </Section>
  );
}
