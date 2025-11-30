/**
 * Data Management Section Component
 */

import { Database, Download, Trash2 } from 'lucide-react';
import { Section, ActionButton } from '../components';

interface DataManagementProps {
  onExportData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function DataManagement({
  onExportData,
  onClearAllData,
  accentColor,
  backgroundColor,
  textColor,
}: DataManagementProps) {
  return (
    <Section
      title="Data Management"
      icon={<Database size={18} />}
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      textColor={textColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <ActionButton
          icon={<Download size={16} />}
          label="Export All Data"
          description="Download all your data as a JSON file"
          onClick={onExportData}
          variant="primary"
          accentColor={accentColor}
          textColor={textColor}
        />
        <ActionButton
          icon={<Trash2 size={16} />}
          label="Clear All Data"
          description="Permanently delete all your local data"
          onClick={onClearAllData}
          variant="danger"
          accentColor={accentColor}
          textColor={textColor}
        />
      </div>
    </Section>
  );
}
