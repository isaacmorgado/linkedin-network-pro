/**
 * Location Matching Logic
 * Calculates geographic proximity scores with hierarchical matching
 *
 * Research Foundation:
 * - Geographic proximity increases connection likelihood
 * - LinkedIn triangle-closing algorithm uses location as signal
 * - Practical collaboration factor in professional networks
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ProfileSimilarityConfig } from './config-types';
import type { Location } from './threshold-types';
import { DEFAULT_LOCATION_THRESHOLDS } from './threshold-types';
import {
  getGeographicRegion,
  US_STATE_ABBREVIATIONS,
} from '../../../lib/industry-mapping';

/**
 * Calculate location similarity based on geographic proximity
 *
 * Scoring (research-backed):
 * - Same city (exact match) → 1.0
 * - Same state/province → 0.7
 * - Same country → 0.4
 * - Same region (e.g., both in Europe) → 0.2
 * - Different regions → 0.0
 *
 * Research: Geographic proximity increases connection likelihood
 * (LinkedIn triangle-closing algorithm uses location as signal)
 *
 * @param p1 - First user profile
 * @param p2 - Second user profile
 * @param config - Optional configuration
 * @returns Location similarity score (0-1)
 */
export function calculateLocationSimilarity(
  p1: UserProfile,
  p2: UserProfile,
  config?: ProfileSimilarityConfig
): number {
  // Handle missing locations
  if (!p1.location || !p2.location) {
    return 0;
  }

  const thresholds = {
    ...DEFAULT_LOCATION_THRESHOLDS,
    ...config?.locationThresholds,
  };

  // Exact match (same city)
  if (p1.location === p2.location) {
    return thresholds.sameCity; // 1.0
  }

  // Parse locations
  const loc1 = parseLocation(p1.location);
  const loc2 = parseLocation(p2.location);

  // Same city (case-insensitive)
  if (
    loc1.city.toLowerCase() === loc2.city.toLowerCase() &&
    loc1.city !== 'Unknown'
  ) {
    return thresholds.sameCity; // 1.0
  }

  // Same state/province
  if (loc1.state && loc2.state && loc1.state === loc2.state) {
    return thresholds.sameState; // 0.7
  }

  // Same country
  if (
    loc1.country.toLowerCase() === loc2.country.toLowerCase() &&
    loc1.country !== 'Unknown'
  ) {
    return thresholds.sameCountry; // 0.4
  }

  // Same region (e.g., both in Europe)
  if (loc1.region === loc2.region && loc1.region !== 'Unknown') {
    return thresholds.sameRegion; // 0.2
  }

  // Different regions
  return thresholds.differentRegions; // 0.0
}

/**
 * Parse location string into structured components
 *
 * Supported formats:
 * - "San Francisco, CA" → city + state (US)
 * - "San Francisco, California" → city + state (US)
 * - "London, UK" → city + country
 * - "London, United Kingdom" → city + country
 * - "Tokyo" → city only (country inferred as Unknown)
 *
 * @param location - Location string
 * @returns Structured Location object
 */
export function parseLocation(location: string): Location {
  if (!location || location.trim() === '') {
    return {
      city: 'Unknown',
      country: 'Unknown',
      region: 'Unknown',
    };
  }

  const parts = location.split(',').map((p) => p.trim());

  if (parts.length === 1) {
    // Single part - could be city or country
    // Try to match as country first
    const region = getGeographicRegion(parts[0]);
    if (region !== 'Unknown') {
      return {
        city: 'Unknown',
        country: parts[0],
        region,
      };
    }

    // Assume it's a city with unknown country
    return {
      city: parts[0],
      country: 'Unknown',
      region: 'Unknown',
    };
  }

  if (parts.length === 2) {
    const [city, secondPart] = parts;

    // Check if second part is US state abbreviation
    if (US_STATE_ABBREVIATIONS[secondPart.toUpperCase()]) {
      return {
        city,
        state: secondPart.toUpperCase(),
        country: 'United States',
        region: 'North America',
      };
    }

    // Check if second part is full US state name
    const stateAbbrev = Object.entries(US_STATE_ABBREVIATIONS).find(
      ([_, fullName]) => fullName.toLowerCase() === secondPart.toLowerCase()
    );
    if (stateAbbrev) {
      return {
        city,
        state: stateAbbrev[0],
        country: 'United States',
        region: 'North America',
      };
    }

    // Assume second part is country
    const region = getGeographicRegion(secondPart);
    return {
      city,
      country: secondPart,
      region: region !== 'Unknown' ? region : 'Unknown',
    };
  }

  // Three or more parts: assume "City, State, Country"
  const city = parts[0];
  const state = parts[1];
  const country = parts[2];
  const region = getGeographicRegion(country);

  return {
    city,
    state,
    country,
    region: region !== 'Unknown' ? region : 'Unknown',
  };
}
