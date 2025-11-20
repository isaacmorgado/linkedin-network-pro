/**
 * Job Matching Service
 * Scores jobs against user preferences
 */

import type {
  LinkedInJob,
  JobMatchCriteria,
  JobMatchResult,
} from '../types/monitoring';
import { log, LogCategory } from '../utils/logger';

/**
 * Calculate how well a job matches user preferences
 * Returns a score from 0-100
 */
export function calculateJobMatch(
  job: LinkedInJob,
  criteria: JobMatchCriteria
): JobMatchResult {
  const endTrace = log.trace(LogCategory.SERVICE, 'calculateJobMatch', {
    jobTitle: job.title,
    criteriaJobTitles: criteria.jobTitles.length,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Starting job match calculation', {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      criteriaSet: {
        titles: criteria.jobTitles.length,
        experienceLevels: criteria.experienceLevel.length,
        workLocations: criteria.workLocation.length,
        locations: criteria.locations.length,
      },
    });

    const matches = {
      title: false,
      experienceLevel: false,
      workLocation: false,
      location: false,
    };

    const reasons: string[] = [];
    let score = 0;

    // Title matching (40 points max)
    log.debug(LogCategory.SERVICE, 'Checking title match');
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
        log.info(LogCategory.SERVICE, `Title matched: "${matchedTitle}"`, { points: 40 });
      } else {
        log.debug(LogCategory.SERVICE, 'No title match found');
      }
    } else {
      // No title preferences set, give partial credit
      score += 20;
      log.debug(LogCategory.SERVICE, 'No title criteria set, partial credit', { points: 20 });
    }

    // Experience level matching (25 points max)
    log.debug(LogCategory.SERVICE, 'Checking experience level match');
    if (criteria.experienceLevel.length > 0 && job.experienceLevel) {
      if (criteria.experienceLevel.includes(job.experienceLevel)) {
        matches.experienceLevel = true;
        score += 25;
        reasons.push(`${job.experienceLevel} level`);
        log.info(LogCategory.SERVICE, `Experience level matched: ${job.experienceLevel}`, { points: 25 });
      } else {
        log.debug(LogCategory.SERVICE, 'Experience level did not match', {
          jobLevel: job.experienceLevel,
          criteriaLevels: criteria.experienceLevel,
        });
      }
    } else {
      // No experience preference or job doesn't specify, give partial credit
      score += 15;
      log.debug(LogCategory.SERVICE, 'No experience level criteria, partial credit', { points: 15 });
    }

    // Work location matching (20 points max)
    log.debug(LogCategory.SERVICE, 'Checking work location match');
    if (criteria.workLocation.length > 0 && job.workLocation) {
      if (criteria.workLocation.includes(job.workLocation)) {
        matches.workLocation = true;
        score += 20;
        reasons.push(`${job.workLocation} work`);
        log.info(LogCategory.SERVICE, `Work location matched: ${job.workLocation}`, { points: 20 });
      } else {
        log.debug(LogCategory.SERVICE, 'Work location did not match', {
          jobLocation: job.workLocation,
          criteriaLocations: criteria.workLocation,
        });
      }
    } else {
      // No location preference or job doesn't specify
      score += 10;
      log.debug(LogCategory.SERVICE, 'No work location criteria, partial credit', { points: 10 });
    }

    // Location matching (15 points max)
    log.debug(LogCategory.SERVICE, 'Checking geographic location match');
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
        log.info(LogCategory.SERVICE, `Location matched: ${matchedLocation}`, { points: 15 });
      } else {
        log.debug(LogCategory.SERVICE, 'No location match found', { jobLocation: job.location });
      }
    } else {
      // No location preferences
      score += 10;
      log.debug(LogCategory.SERVICE, 'No location criteria, partial credit', { points: 10 });
    }

    // Bonus points for Easy Apply
    if (job.isEasyApply) {
      score = Math.min(100, score + 5);
      reasons.push('Easy Apply available');
      log.debug(LogCategory.SERVICE, 'Easy Apply bonus applied', { points: 5 });
    }

    // Bonus points for recently posted
    const hoursSincePosted = (Date.now() - job.postedTimestamp) / (1000 * 60 * 60);
    if (hoursSincePosted < 24) {
      score = Math.min(100, score + 3);
      reasons.push('Posted recently');
      log.debug(LogCategory.SERVICE, 'Recent posting bonus applied', {
        points: 3,
        hoursAgo: hoursSincePosted.toFixed(1),
      });
    }

    const result = {
      score: Math.round(score),
      matches,
      reasons,
    };

    log.info(LogCategory.SERVICE, 'Job match calculation completed', {
      jobTitle: job.title,
      finalScore: result.score,
      matchedCriteria: Object.entries(matches).filter(([_, v]) => v).map(([k]) => k),
      reasonsCount: reasons.length,
    });

    endTrace(result);
    return result;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Job match calculation failed', error as Error, {
      jobId: job.id,
      jobTitle: job.title,
    });
    endTrace();
    throw error;
  }
}

/**
 * Filter jobs that meet minimum match threshold
 */
export function filterMatchingJobs(
  jobs: LinkedInJob[],
  criteria: JobMatchCriteria,
  minScore: number = 50
): Array<{ job: LinkedInJob; match: JobMatchResult }> {
  const endTrace = log.trace(LogCategory.SERVICE, 'filterMatchingJobs', {
    totalJobs: jobs.length,
    minScore,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Filtering jobs by match score', {
      jobsToEvaluate: jobs.length,
      minScoreThreshold: minScore,
    });

    const evaluated = jobs.map((job) => ({
      job,
      match: calculateJobMatch(job, criteria),
    }));

    log.info(LogCategory.SERVICE, 'All jobs evaluated', {
      totalEvaluated: evaluated.length,
      scoreDistribution: {
        excellent: evaluated.filter((e) => e.match.score >= 80).length,
        good: evaluated.filter((e) => e.match.score >= 65 && e.match.score < 80).length,
        fair: evaluated.filter((e) => e.match.score >= 50 && e.match.score < 65).length,
        poor: evaluated.filter((e) => e.match.score < 50).length,
      },
    });

    const filtered = evaluated.filter(({ match }) => match.score >= minScore);
    log.info(LogCategory.SERVICE, `Filtered to ${filtered.length} jobs meeting threshold`);

    const sorted = filtered.sort((a, b) => b.match.score - a.match.score);

    log.info(LogCategory.SERVICE, 'Job filtering completed', {
      totalInput: jobs.length,
      passedFilter: sorted.length,
      filteredOut: jobs.length - sorted.length,
      topScores: sorted.slice(0, 5).map((m) => ({ title: m.job.title, score: m.match.score })),
    });

    endTrace(sorted);
    return sorted;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Job filtering failed', error as Error, {
      jobCount: jobs.length,
      minScore,
    });
    endTrace();
    throw error;
  }
}
