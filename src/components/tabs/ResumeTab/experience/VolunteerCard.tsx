import type { VolunteerExperience } from '../../../../types/resume';
import { JobCard } from './JobCard';

export function VolunteerCard({
  volunteer,
  onEdit,
  onDelete
}: {
  volunteer: VolunteerExperience;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <JobCard
      job={{ ...volunteer, title: volunteer.role, company: volunteer.organization } as any}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
