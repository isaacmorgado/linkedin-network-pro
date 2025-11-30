import { Briefcase } from 'lucide-react';

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <Briefcase size={48} strokeWidth={1.5} style={{ color: '#d1d5db', margin: '0 auto 16px auto' }} />
      <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>{message}</p>
    </div>
  );
}
