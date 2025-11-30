/**
 * Query Formatters
 * Capitalize and format extracted entities
 */

/**
 * Capitalize company name properly
 */
export function capitalizeCompanyName(company: string): string {
  // Known company capitalizations
  const knownCompanies: Record<string, string> = {
    'google': 'Google',
    'facebook': 'Facebook',
    'meta': 'Meta',
    'microsoft': 'Microsoft',
    'apple': 'Apple',
    'amazon': 'Amazon',
    'netflix': 'Netflix',
    'tesla': 'Tesla',
    'ibm': 'IBM',
    'salesforce': 'Salesforce',
    'linkedin': 'LinkedIn',
    'uber': 'Uber',
    'airbnb': 'Airbnb',
    'spotify': 'Spotify',
  };

  const lower = company.toLowerCase();
  if (knownCompanies[lower]) {
    return knownCompanies[lower]!;
  }

  // Default: capitalize each word
  return company
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Capitalize location properly
 */
export function capitalizeLocation(location: string): string {
  // Known location abbreviations
  const knownLocations: Record<string, string> = {
    'sf': 'SF',
    'san francisco': 'San Francisco',
    'nyc': 'NYC',
    'new york': 'New York',
    'la': 'LA',
    'los angeles': 'Los Angeles',
    'seattle': 'Seattle',
    'boston': 'Boston',
    'austin': 'Austin',
    'chicago': 'Chicago',
    'dc': 'DC',
    'washington dc': 'Washington DC',
  };

  const lower = location.toLowerCase();
  if (knownLocations[lower]) {
    return knownLocations[lower]!;
  }

  // Default: capitalize each word
  return location
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
