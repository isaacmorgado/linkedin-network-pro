/**
 * Industry Relationship Mapping
 * Defines which industries are considered "related" for similarity scoring
 *
 * Research Foundation:
 * - LinkedIn industry taxonomy (2025)
 * - Career transition patterns analysis
 * - Professional network clustering data
 *
 * Purpose: When exact industry match isn't found, related industries
 * receive partial credit (0.6 score vs 1.0 for exact match)
 */

import { GeographicRegion } from './profile-similarity-types';

/**
 * Industry relationship data structure
 * Each industry maps to a list of related/adjacent industries
 *
 * Relationship criteria:
 * - Shared skill requirements (e.g., Software Development ↔ IT Services)
 * - Common career transitions (e.g., Consulting ↔ Investment Banking)
 * - Overlapping professional networks
 * - Similar domain knowledge
 */
export const INDUSTRY_RELATIONSHIPS: Record<string, string[]> = {
  // Technology & Software
  'Software Development': [
    'Information Technology',
    'Computer Software',
    'Internet',
    'SaaS',
    'Cloud Computing',
    'IT Services',
    'Telecommunications',
    'Computer Networking',
  ],

  'Information Technology': [
    'Software Development',
    'IT Services',
    'Computer Networking',
    'Cybersecurity',
    'Cloud Computing',
    'Telecommunications',
    'Computer Software',
  ],

  'Computer Software': [
    'Software Development',
    'Information Technology',
    'SaaS',
    'Internet',
    'Cloud Computing',
    'Gaming',
    'Mobile Applications',
  ],

  'SaaS': [
    'Software Development',
    'Computer Software',
    'Cloud Computing',
    'Internet',
    'Information Technology',
    'IT Services',
  ],

  'Cloud Computing': [
    'Software Development',
    'Information Technology',
    'SaaS',
    'Computer Software',
    'IT Services',
    'Data Infrastructure',
  ],

  'Cybersecurity': [
    'Information Technology',
    'IT Services',
    'Computer Networking',
    'Software Development',
    'Risk Management',
    'Consulting',
  ],

  'IT Services': [
    'Information Technology',
    'Software Development',
    'Consulting',
    'Business Consulting',
    'Cloud Computing',
    'Managed Services',
  ],

  // Data & Analytics
  'Data Science': [
    'Machine Learning',
    'Artificial Intelligence',
    'Analytics',
    'Big Data',
    'Research',
    'Statistics',
    'Software Development',
  ],

  'Machine Learning': [
    'Data Science',
    'Artificial Intelligence',
    'Research',
    'Software Development',
    'Robotics',
    'Computer Vision',
  ],

  'Artificial Intelligence': [
    'Machine Learning',
    'Data Science',
    'Research',
    'Robotics',
    'Computer Vision',
    'Natural Language Processing',
    'Software Development',
  ],

  'Analytics': [
    'Data Science',
    'Business Intelligence',
    'Consulting',
    'Market Research',
    'Statistics',
    'Big Data',
  ],

  'Big Data': [
    'Data Science',
    'Analytics',
    'Cloud Computing',
    'Software Development',
    'Data Infrastructure',
  ],

  // Finance & Banking
  'Investment Banking': [
    'Finance',
    'Private Equity',
    'Venture Capital',
    'Corporate Finance',
    'Consulting',
    'Hedge Funds',
    'Asset Management',
  ],

  'Finance': [
    'Investment Banking',
    'Accounting',
    'Financial Services',
    'Corporate Finance',
    'Private Equity',
    'Asset Management',
  ],

  'Accounting': [
    'Finance',
    'Consulting',
    'Audit',
    'Tax Services',
    'Financial Services',
    'Corporate Finance',
  ],

  'Financial Services': [
    'Finance',
    'Banking',
    'Investment Banking',
    'Insurance',
    'Asset Management',
    'Wealth Management',
  ],

  'Private Equity': [
    'Investment Banking',
    'Venture Capital',
    'Finance',
    'Corporate Finance',
    'Hedge Funds',
    'Asset Management',
  ],

  'Venture Capital': [
    'Private Equity',
    'Investment Banking',
    'Startups',
    'Technology',
    'Finance',
    'Angel Investing',
  ],

  // Consulting & Professional Services
  'Consulting': [
    'Management Consulting',
    'Business Consulting',
    'Strategy',
    'IT Services',
    'Accounting',
    'Investment Banking',
    'Advisory',
  ],

  'Management Consulting': [
    'Consulting',
    'Strategy',
    'Business Consulting',
    'Investment Banking',
    'Operations',
    'Organizational Development',
  ],

  'Business Consulting': [
    'Consulting',
    'Management Consulting',
    'Strategy',
    'IT Services',
    'Advisory',
    'Professional Services',
  ],

  'Strategy': [
    'Management Consulting',
    'Consulting',
    'Business Development',
    'Corporate Development',
    'Investment Banking',
  ],

  // Marketing & Advertising
  'Marketing': [
    'Digital Marketing',
    'Advertising',
    'Brand Management',
    'Public Relations',
    'Social Media',
    'Content Marketing',
    'Market Research',
  ],

  'Digital Marketing': [
    'Marketing',
    'Advertising',
    'Social Media',
    'SEO/SEM',
    'Content Marketing',
    'E-commerce',
    'Growth Marketing',
  ],

  'Advertising': [
    'Marketing',
    'Digital Marketing',
    'Brand Management',
    'Public Relations',
    'Media',
    'Creative Services',
  ],

  'Public Relations': [
    'Marketing',
    'Advertising',
    'Communications',
    'Media Relations',
    'Brand Management',
    'Corporate Communications',
  ],

  // Healthcare & Life Sciences
  'Healthcare': [
    'Pharmaceuticals',
    'Biotechnology',
    'Medical Devices',
    'Hospital & Health Care',
    'Health & Wellness',
    'Telemedicine',
  ],

  'Pharmaceuticals': [
    'Healthcare',
    'Biotechnology',
    'Life Sciences',
    'Medical Devices',
    'Research',
    'Clinical Research',
  ],

  'Biotechnology': [
    'Pharmaceuticals',
    'Healthcare',
    'Life Sciences',
    'Research',
    'Genomics',
    'Medical Devices',
  ],

  'Medical Devices': [
    'Healthcare',
    'Biotechnology',
    'Pharmaceuticals',
    'Manufacturing',
    'Engineering',
  ],

  // Education & Research
  'Education': [
    'Higher Education',
    'E-Learning',
    'EdTech',
    'Research',
    'Training & Development',
    'Academic',
  ],

  'Higher Education': [
    'Education',
    'Research',
    'Academic',
    'E-Learning',
    'EdTech',
  ],

  'EdTech': [
    'Education',
    'E-Learning',
    'Software Development',
    'SaaS',
    'Higher Education',
  ],

  'Research': [
    'Education',
    'Higher Education',
    'Data Science',
    'Biotechnology',
    'Pharmaceuticals',
    'Academic',
  ],

  // Manufacturing & Engineering
  'Manufacturing': [
    'Engineering',
    'Industrial Manufacturing',
    'Automotive',
    'Aerospace',
    'Supply Chain',
    'Operations',
  ],

  'Engineering': [
    'Manufacturing',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Aerospace',
    'Automotive',
  ],

  'Aerospace': [
    'Engineering',
    'Manufacturing',
    'Defense',
    'Aviation',
    'Mechanical Engineering',
  ],

  'Automotive': [
    'Engineering',
    'Manufacturing',
    'Transportation',
    'Supply Chain',
    'Electric Vehicles',
  ],

  // Retail & E-commerce
  'Retail': [
    'E-commerce',
    'Consumer Goods',
    'Fashion',
    'Wholesale',
    'Supply Chain',
    'Merchandising',
  ],

  'E-commerce': [
    'Retail',
    'Internet',
    'Digital Marketing',
    'Supply Chain',
    'Software Development',
    'Logistics',
  ],

  'Consumer Goods': [
    'Retail',
    'Manufacturing',
    'Brand Management',
    'Marketing',
    'Supply Chain',
    'CPG',
  ],

  // Real Estate & Construction
  'Real Estate': [
    'Construction',
    'Property Management',
    'Architecture',
    'Urban Planning',
    'Finance',
    'Investment',
  ],

  'Construction': [
    'Real Estate',
    'Engineering',
    'Architecture',
    'Civil Engineering',
    'Project Management',
    'Manufacturing',
  ],

  'Architecture': [
    'Construction',
    'Real Estate',
    'Urban Planning',
    'Engineering',
    'Design',
  ],

  // Media & Entertainment
  'Media': [
    'Entertainment',
    'Publishing',
    'Broadcasting',
    'Journalism',
    'Digital Media',
    'Content Production',
  ],

  'Entertainment': [
    'Media',
    'Film',
    'Music',
    'Gaming',
    'Broadcasting',
    'Content Production',
  ],

  'Gaming': [
    'Entertainment',
    'Software Development',
    'Computer Software',
    'Digital Media',
    'Esports',
  ],

  // Energy & Utilities
  'Energy': [
    'Oil & Gas',
    'Renewable Energy',
    'Utilities',
    'Sustainability',
    'Engineering',
    'Environmental Services',
  ],

  'Renewable Energy': [
    'Energy',
    'Sustainability',
    'Utilities',
    'Engineering',
    'Environmental Services',
    'Clean Tech',
  ],

  'Oil & Gas': [
    'Energy',
    'Utilities',
    'Engineering',
    'Petroleum',
    'Chemical',
  ],

  // Legal & Government
  'Legal': [
    'Law',
    'Corporate Law',
    'Intellectual Property',
    'Compliance',
    'Regulatory Affairs',
    'Government',
  ],

  'Government': [
    'Public Policy',
    'Legal',
    'Non-Profit',
    'Public Administration',
    'Defense',
  ],

  'Non-Profit': [
    'Government',
    'Social Impact',
    'Education',
    'Healthcare',
    'Philanthropy',
    'NGO',
  ],

  // Hospitality & Travel
  'Hospitality': [
    'Travel',
    'Tourism',
    'Hotels',
    'Restaurants',
    'Events',
    'Leisure',
  ],

  'Travel': [
    'Hospitality',
    'Tourism',
    'Transportation',
    'Aviation',
    'Leisure',
  ],

  // Transportation & Logistics
  'Transportation': [
    'Logistics',
    'Supply Chain',
    'Aviation',
    'Automotive',
    'Shipping',
    'Freight',
  ],

  'Logistics': [
    'Transportation',
    'Supply Chain',
    'E-commerce',
    'Retail',
    'Manufacturing',
    'Warehousing',
  ],

  'Supply Chain': [
    'Logistics',
    'Transportation',
    'Manufacturing',
    'Retail',
    'Operations',
    'Procurement',
  ],

  // Human Resources & Recruiting
  'Human Resources': [
    'Recruiting',
    'Talent Acquisition',
    'Training & Development',
    'Organizational Development',
    'Compensation & Benefits',
    'HR Tech',
  ],

  'Recruiting': [
    'Human Resources',
    'Talent Acquisition',
    'Staffing',
    'HR Tech',
    'Executive Search',
  ],

  // Sales & Business Development
  'Sales': [
    'Business Development',
    'Account Management',
    'SaaS',
    'Marketing',
    'Enterprise Sales',
    'Retail',
  ],

  'Business Development': [
    'Sales',
    'Strategy',
    'Corporate Development',
    'Partnerships',
    'Marketing',
    'Venture Capital',
  ],
};

/**
 * Check if two industries are related
 *
 * @param industry1 - First industry name
 * @param industry2 - Second industry name
 * @returns True if industries are related (bidirectional check)
 */
export function areIndustriesRelated(
  industry1: string,
  industry2: string
): boolean {
  if (!industry1 || !industry2) {
    return false;
  }

  // Normalize to title case for consistent matching
  const norm1 = normalizeIndustryName(industry1);
  const norm2 = normalizeIndustryName(industry2);

  // Check if they're the same (case-insensitive)
  if (norm1.toLowerCase() === norm2.toLowerCase()) {
    return true;
  }

  // Check if industry1 lists industry2 as related
  const related1 = INDUSTRY_RELATIONSHIPS[norm1];
  if (related1?.some((r) => r.toLowerCase() === norm2.toLowerCase())) {
    return true;
  }

  // Check if industry2 lists industry1 as related (bidirectional)
  const related2 = INDUSTRY_RELATIONSHIPS[norm2];
  if (related2?.some((r) => r.toLowerCase() === norm1.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Get all related industries for a given industry
 *
 * @param industry - Industry name
 * @returns Array of related industry names
 */
export function getRelatedIndustries(industry: string): string[] {
  if (!industry) {
    return [];
  }

  const normalized = normalizeIndustryName(industry);
  return INDUSTRY_RELATIONSHIPS[normalized] || [];
}

/**
 * Normalize industry name for consistent matching
 * Handles common variations and whitespace
 *
 * @param industry - Raw industry name
 * @returns Normalized industry name
 */
function normalizeIndustryName(industry: string): string {
  // Trim whitespace and convert to title case
  const trimmed = industry.trim();

  // Check if exact match exists in our mapping
  if (INDUSTRY_RELATIONSHIPS[trimmed]) {
    return trimmed;
  }

  // Check case-insensitive match
  for (const key of Object.keys(INDUSTRY_RELATIONSHIPS)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) {
      return key;
    }
  }

  // Return original if no match found
  return trimmed;
}

/**
 * Country to region mapping for location similarity
 * Based on geographic and economic regions
 */
export const COUNTRY_TO_REGION: Record<string, GeographicRegion> = {
  // North America
  'United States': GeographicRegion.NORTH_AMERICA,
  'USA': GeographicRegion.NORTH_AMERICA,
  'US': GeographicRegion.NORTH_AMERICA,
  'Canada': GeographicRegion.NORTH_AMERICA,
  'Mexico': GeographicRegion.NORTH_AMERICA,

  // South America
  'Brazil': GeographicRegion.SOUTH_AMERICA,
  'Argentina': GeographicRegion.SOUTH_AMERICA,
  'Chile': GeographicRegion.SOUTH_AMERICA,
  'Colombia': GeographicRegion.SOUTH_AMERICA,
  'Peru': GeographicRegion.SOUTH_AMERICA,
  'Venezuela': GeographicRegion.SOUTH_AMERICA,
  'Ecuador': GeographicRegion.SOUTH_AMERICA,
  'Bolivia': GeographicRegion.SOUTH_AMERICA,
  'Paraguay': GeographicRegion.SOUTH_AMERICA,
  'Uruguay': GeographicRegion.SOUTH_AMERICA,

  // Europe
  'United Kingdom': GeographicRegion.EUROPE,
  'UK': GeographicRegion.EUROPE,
  'England': GeographicRegion.EUROPE,
  'Scotland': GeographicRegion.EUROPE,
  'Wales': GeographicRegion.EUROPE,
  'Ireland': GeographicRegion.EUROPE,
  'France': GeographicRegion.EUROPE,
  'Germany': GeographicRegion.EUROPE,
  'Italy': GeographicRegion.EUROPE,
  'Spain': GeographicRegion.EUROPE,
  'Portugal': GeographicRegion.EUROPE,
  'Netherlands': GeographicRegion.EUROPE,
  'Belgium': GeographicRegion.EUROPE,
  'Switzerland': GeographicRegion.EUROPE,
  'Austria': GeographicRegion.EUROPE,
  'Sweden': GeographicRegion.EUROPE,
  'Norway': GeographicRegion.EUROPE,
  'Denmark': GeographicRegion.EUROPE,
  'Finland': GeographicRegion.EUROPE,
  'Poland': GeographicRegion.EUROPE,
  'Czech Republic': GeographicRegion.EUROPE,
  'Hungary': GeographicRegion.EUROPE,
  'Romania': GeographicRegion.EUROPE,
  'Greece': GeographicRegion.EUROPE,
  'Russia': GeographicRegion.EUROPE,

  // Asia
  'China': GeographicRegion.ASIA,
  'Japan': GeographicRegion.ASIA,
  'South Korea': GeographicRegion.ASIA,
  'India': GeographicRegion.ASIA,
  'Singapore': GeographicRegion.ASIA,
  'Hong Kong': GeographicRegion.ASIA,
  'Taiwan': GeographicRegion.ASIA,
  'Thailand': GeographicRegion.ASIA,
  'Vietnam': GeographicRegion.ASIA,
  'Malaysia': GeographicRegion.ASIA,
  'Indonesia': GeographicRegion.ASIA,
  'Philippines': GeographicRegion.ASIA,
  'Pakistan': GeographicRegion.ASIA,
  'Bangladesh': GeographicRegion.ASIA,

  // Middle East
  'Israel': GeographicRegion.MIDDLE_EAST,
  'Saudi Arabia': GeographicRegion.MIDDLE_EAST,
  'United Arab Emirates': GeographicRegion.MIDDLE_EAST,
  'UAE': GeographicRegion.MIDDLE_EAST,
  'Dubai': GeographicRegion.MIDDLE_EAST,
  'Qatar': GeographicRegion.MIDDLE_EAST,
  'Kuwait': GeographicRegion.MIDDLE_EAST,
  'Bahrain': GeographicRegion.MIDDLE_EAST,
  'Oman': GeographicRegion.MIDDLE_EAST,
  'Jordan': GeographicRegion.MIDDLE_EAST,
  'Lebanon': GeographicRegion.MIDDLE_EAST,
  'Turkey': GeographicRegion.MIDDLE_EAST,

  // Africa
  'South Africa': GeographicRegion.AFRICA,
  'Nigeria': GeographicRegion.AFRICA,
  'Kenya': GeographicRegion.AFRICA,
  'Egypt': GeographicRegion.AFRICA,
  'Morocco': GeographicRegion.AFRICA,
  'Ethiopia': GeographicRegion.AFRICA,
  'Ghana': GeographicRegion.AFRICA,

  // Oceania
  'Australia': GeographicRegion.OCEANIA,
  'New Zealand': GeographicRegion.OCEANIA,
};

/**
 * Get geographic region for a country
 *
 * @param country - Country name
 * @returns Geographic region or UNKNOWN if not found
 */
export function getGeographicRegion(country: string): GeographicRegion {
  if (!country) {
    return GeographicRegion.UNKNOWN;
  }

  const normalized = country.trim();
  return COUNTRY_TO_REGION[normalized] || GeographicRegion.UNKNOWN;
}

/**
 * Common US state abbreviations for location parsing
 */
export const US_STATE_ABBREVIATIONS: Record<string, string> = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia',
};
