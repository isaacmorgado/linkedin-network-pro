import type { InternshipExperience } from '../../../../types/resume';
import { JobCard } from './JobCard';

export function InternshipCard({
  internship,
  onEdit,
  onDelete
}: {
  internship: InternshipExperience;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return <JobCard job={internship as any} onEdit={onEdit} onDelete={onDelete} />;
}
