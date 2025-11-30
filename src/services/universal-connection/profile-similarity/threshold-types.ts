/**
 * Threshold Types
 * Configuration thresholds for different similarity metrics
 */

/**
 * Parsed location with hierarchical components
 * Enables geographic proximity scoring
 */
export interface Location {
  /** City name (e.g., "San Francisco") */
  city: string;

  /** State/province code (e.g., "CA") - optional for non-US/Canada */
  state?: string;

  /** Country name (e.g., "United States") */
  country: string;

  /** Geographic region (e.g., "North America", "Europe", "Asia") */
  region: string;
}

/**
 * Geographic region classifications for location similarity
 */
export enum GeographicRegion {
  NORTH_AMERICA = 'North America',
  SOUTH_AMERICA = 'South America',
  EUROPE = 'Europe',
  ASIA = 'Asia',
  AFRICA = 'Africa',
  OCEANIA = 'Oceania',
  MIDDLE_EAST = 'Middle East',
  UNKNOWN = 'Unknown',
}

/**
 * Location similarity scoring thresholds
 * Based on geographic proximity levels
 */
export interface LocationSimilarityThresholds {
  /** Same city (exact match) - 1.0 */
  sameCity: number;

  /** Same state/province - 0.7 */
  sameState: number;

  /** Same country - 0.4 */
  sameCountry: number;

  /** Same region (e.g., both in Europe) - 0.2 */
  sameRegion: number;

  /** Different regions - 0.0 */
  differentRegions: number;
}

/**
 * Default location similarity thresholds
 * Research-backed values for geographic proximity scoring
 */
export const DEFAULT_LOCATION_THRESHOLDS: LocationSimilarityThresholds = {
  sameCity: 1.0,
  sameState: 0.7,
  sameCountry: 0.4,
  sameRegion: 0.2,
  differentRegions: 0.0,
};

/**
 * Education similarity scoring thresholds
 */
export interface EducationSimilarityThresholds {
  /** Exact school match (alumni connection) - 1.0 */
  sameSchool: number;

  /** Same field of study but different schools - 0.5 */
  sameField: number;

  /** No overlap - 0.0 */
  noOverlap: number;
}

/**
 * Default education similarity thresholds
 * Based on research showing alumni connections have 35-42% acceptance rate
 */
export const DEFAULT_EDUCATION_THRESHOLDS: EducationSimilarityThresholds = {
  sameSchool: 1.0,
  sameField: 0.5,
  noOverlap: 0.0,
};

/**
 * Industry similarity scoring thresholds
 */
export interface IndustrySimilarityThresholds {
  /** Exact industry match - 1.0 */
  exactMatch: number;

  /** Related industries (from mapping) - 0.6 */
  relatedIndustries: number;

  /** No overlap - 0.0 */
  noOverlap: number;
}

/**
 * Default industry similarity thresholds
 */
export const DEFAULT_INDUSTRY_THRESHOLDS: IndustrySimilarityThresholds = {
  exactMatch: 1.0,
  relatedIndustries: 0.6,
  noOverlap: 0.0,
};

/**
 * Industry relationship mapping entry
 * Defines which industries are considered "related" for similarity scoring
 */
export interface IndustryRelationship {
  /** Primary industry name */
  industry: string;

  /** List of related/adjacent industries */
  relatedIndustries: string[];
}
