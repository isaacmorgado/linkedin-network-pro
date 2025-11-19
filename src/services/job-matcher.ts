/**
 * Job Matching Service
 * Scores jobs against user preferences
 */

import type {
  LinkedInJob,
  JobMatchCriteria,
  JobMatchResult,
} from '../types/monitoring';

/**
 * Calculate how well a job matches user preferences
 * Returns a score from 0-100
 */
export function calculateJobMatch(
  job: LinkedInJob,
  criteria: JobMatchCriteria
): JobMatchResult {
  const matches = {
    title: false,
    experienceLevel: false,
    workLocation: false,
    location: false,
  };

  const reasons: string[] = [];
  let score = 0;

  // Title matching (40 points max)
  if (criteria.jobTitles.length > 0) {
    const titleLower = job.title.toLowerCase();
    const matchedTitle = criteria.jobTitles.find((prefTitle) =>
      titleLower.includes(prefTitle.toLowerCase()) ||
      prefTitle.toLowerCase().includes(titleLower)
    );

    if (matchedTitle) {
      matches.title = true;
      score += 40;
      reasons.push(`Matches "${matchedTitle}"`);
    }
  } else {
    // No title preferences set, give partial credit
    score += 20;
  }

  // Experience level matching (25 points max)
  if (criteria.experienceLevel.length > 0 && job.experienceLevel) {
    if (criteria.experienceLevel.includes(job.experienceLevel)) {
      matches.experienceLevel = true;
      score += 25;
      reasons.push(`${job.experienceLevel} level`);
    }
  } else {
    // No experience preference or job doesn't specify, give partial credit
    score += 15;
  }

  // Work location matching (20 points max)
  if (criteria.workLocation.length > 0 && job.workLocation) {
    if (criteria.workLocation.includes(job.workLocation)) {
      matches.workLocation = true;
      score += 20;
      reasons.push(`${job.workLocation} work`);
    }
  } else {
    // No location preference or job doesn't specify
    score += 10;
  }

  // Location matching (15 points max)
  if (criteria.locations.length > 0) {
    const locationLower = job.location.toLowerCase();
    const matchedLocation = criteria.locations.find((prefLoc) =>
      locationLower.includes(prefLoc.toLowerCase()) ||
      prefLoc.toLowerCase().includes(locationLower)
    );

    if (matchedLocation) {
      matches.location = true;
      score += 15;
      reasons.push(`Located in ${matchedLocation}`);
    }
  } else {
    // No location preferences
    score += 10;
  }

  // Bonus points for Easy Apply
  if (job.isEasyApply) {
    score = Math.min(100, score + 5);
    reasons.push('Easy Apply available');
  }

  // Bonus points for recently posted
  const hoursSincePosted = (Date.now() - job.postedTimestamp) / (1000 * 60 * 60);
  if (hoursSincePosted < 24) {
    score = Math.min(100, score + 3);
    reasons.push('Posted recently');
  }

  return {
    score: Math.round(score),
    matches,
    reasons,
  };
}

/**
 * Filter jobs that meet minimum match threshold
 */
export function filterMatchingJobs(
  jobs: LinkedInJob[],
  criteria: JobMatchCriteria,
  minScore: number = 50
): Array<{ job: LinkedInJob; match: JobMatchResult }> {
  return jobs
    .map((job) => ({
      job,
      match: calculateJobMatch(job, criteria),
    }))
    .filter(({ match }) => match.score >= minScore)
    .sort((a, b) => b.match.score - a.match.score);
}
