/**
 * Basic US Zip Code to City/State lookup
 * In production, use a proper geocoding API
 * This covers common zips for demo purposes
 */

interface ZipInfo {
  city: string
  state: string
}

// Common zip codes - expand as needed
const ZIP_DATABASE: Record<string, ZipInfo> = {
  // California
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '90266': { city: 'Manhattan Beach', state: 'CA' },
  '90254': { city: 'Hermosa Beach', state: 'CA' },
  '90277': { city: 'Redondo Beach', state: 'CA' },
  '90401': { city: 'Santa Monica', state: 'CA' },
  '90291': { city: 'Venice', state: 'CA' },
  '90292': { city: 'Marina del Rey', state: 'CA' },
  '90024': { city: 'Westwood', state: 'CA' },
  '90025': { city: 'West LA', state: 'CA' },
  '90049': { city: 'Brentwood', state: 'CA' },
  '90272': { city: 'Pacific Palisades', state: 'CA' },
  '90230': { city: 'Culver City', state: 'CA' },
  '90232': { city: 'Culver City', state: 'CA' },
  '90245': { city: 'El Segundo', state: 'CA' },
  '90503': { city: 'Torrance', state: 'CA' },
  '90274': { city: 'Palos Verdes', state: 'CA' },
  '90275': { city: 'Rancho Palos Verdes', state: 'CA' },
  '90278': { city: 'Redondo Beach', state: 'CA' },
  '90501': { city: 'Torrance', state: 'CA' },
  '90094': { city: 'Playa Vista', state: 'CA' },
  '90301': { city: 'Inglewood', state: 'CA' },
  '90302': { city: 'Inglewood', state: 'CA' },
  '90045': { city: 'Westchester', state: 'CA' },
  '90293': { city: 'Playa del Rey', state: 'CA' },
  '90034': { city: 'Palms', state: 'CA' },
  '90035': { city: 'Mid-City', state: 'CA' },
  '90036': { city: 'Park La Brea', state: 'CA' },
  '90048': { city: 'West Hollywood', state: 'CA' },
  '90069': { city: 'West Hollywood', state: 'CA' },
  '90046': { city: 'Hollywood Hills', state: 'CA' },
  '90028': { city: 'Hollywood', state: 'CA' },
  '90038': { city: 'Hollywood', state: 'CA' },
  '90068': { city: 'Hollywood Hills', state: 'CA' },
  '91401': { city: 'Van Nuys', state: 'CA' },
  '91403': { city: 'Sherman Oaks', state: 'CA' },
  '91423': { city: 'Sherman Oaks', state: 'CA' },
  '91436': { city: 'Encino', state: 'CA' },
  '91316': { city: 'Encino', state: 'CA' },
  '91604': { city: 'Studio City', state: 'CA' },
  '91602': { city: 'North Hollywood', state: 'CA' },
  '91505': { city: 'Burbank', state: 'CA' },
  '91506': { city: 'Burbank', state: 'CA' },
  '91101': { city: 'Pasadena', state: 'CA' },
  '91105': { city: 'Pasadena', state: 'CA' },
  '91106': { city: 'Pasadena', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '94103': { city: 'San Francisco', state: 'CA' },
  '94107': { city: 'San Francisco', state: 'CA' },
  '94110': { city: 'San Francisco', state: 'CA' },
  '94114': { city: 'San Francisco', state: 'CA' },
  '94117': { city: 'San Francisco', state: 'CA' },
  '94118': { city: 'San Francisco', state: 'CA' },
  '94121': { city: 'San Francisco', state: 'CA' },
  '94122': { city: 'San Francisco', state: 'CA' },
  '94123': { city: 'San Francisco', state: 'CA' },
  '94127': { city: 'San Francisco', state: 'CA' },
  '94131': { city: 'San Francisco', state: 'CA' },
  '94132': { city: 'San Francisco', state: 'CA' },
  '94133': { city: 'San Francisco', state: 'CA' },
  '94301': { city: 'Palo Alto', state: 'CA' },
  '94304': { city: 'Palo Alto', state: 'CA' },
  '94040': { city: 'Mountain View', state: 'CA' },
  '94043': { city: 'Mountain View', state: 'CA' },
  '95014': { city: 'Cupertino', state: 'CA' },
  
  // New York
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '10010': { city: 'New York', state: 'NY' },
  '10011': { city: 'New York', state: 'NY' },
  '10012': { city: 'New York', state: 'NY' },
  '10013': { city: 'New York', state: 'NY' },
  '10014': { city: 'New York', state: 'NY' },
  '10016': { city: 'New York', state: 'NY' },
  '10017': { city: 'New York', state: 'NY' },
  '10019': { city: 'New York', state: 'NY' },
  '10021': { city: 'New York', state: 'NY' },
  '10022': { city: 'New York', state: 'NY' },
  '10023': { city: 'New York', state: 'NY' },
  '10024': { city: 'New York', state: 'NY' },
  '10025': { city: 'New York', state: 'NY' },
  '10028': { city: 'New York', state: 'NY' },
  '10029': { city: 'New York', state: 'NY' },
  '10030': { city: 'Harlem', state: 'NY' },
  '10031': { city: 'Harlem', state: 'NY' },
  '10032': { city: 'Washington Heights', state: 'NY' },
  '10033': { city: 'Washington Heights', state: 'NY' },
  '10034': { city: 'Inwood', state: 'NY' },
  '10035': { city: 'East Harlem', state: 'NY' },
  '10036': { city: 'Times Square', state: 'NY' },
  '10128': { city: 'Upper East Side', state: 'NY' },
  '11201': { city: 'Brooklyn Heights', state: 'NY' },
  '11205': { city: 'Brooklyn', state: 'NY' },
  '11211': { city: 'Williamsburg', state: 'NY' },
  '11215': { city: 'Park Slope', state: 'NY' },
  '11217': { city: 'Park Slope', state: 'NY' },
  '11222': { city: 'Greenpoint', state: 'NY' },
  '11225': { city: 'Crown Heights', state: 'NY' },
  '11226': { city: 'Flatbush', state: 'NY' },
  '11230': { city: 'Midwood', state: 'NY' },
  '11231': { city: 'Carroll Gardens', state: 'NY' },
  '11238': { city: 'Prospect Heights', state: 'NY' },
  
  // Texas
  '75201': { city: 'Dallas', state: 'TX' },
  '75202': { city: 'Dallas', state: 'TX' },
  '75204': { city: 'Dallas', state: 'TX' },
  '75205': { city: 'Highland Park', state: 'TX' },
  '75206': { city: 'Dallas', state: 'TX' },
  '75209': { city: 'Dallas', state: 'TX' },
  '75214': { city: 'Dallas', state: 'TX' },
  '75219': { city: 'Dallas', state: 'TX' },
  '75225': { city: 'University Park', state: 'TX' },
  '77002': { city: 'Houston', state: 'TX' },
  '77003': { city: 'Houston', state: 'TX' },
  '77004': { city: 'Houston', state: 'TX' },
  '77005': { city: 'Houston', state: 'TX' },
  '77006': { city: 'Montrose', state: 'TX' },
  '77007': { city: 'Houston Heights', state: 'TX' },
  '77008': { city: 'Houston Heights', state: 'TX' },
  '77019': { city: 'River Oaks', state: 'TX' },
  '77024': { city: 'Memorial', state: 'TX' },
  '77025': { city: 'Bellaire', state: 'TX' },
  '78701': { city: 'Austin', state: 'TX' },
  '78702': { city: 'East Austin', state: 'TX' },
  '78703': { city: 'Tarrytown', state: 'TX' },
  '78704': { city: 'South Austin', state: 'TX' },
  '78705': { city: 'Austin', state: 'TX' },
  '78731': { city: 'Austin', state: 'TX' },
  '78745': { city: 'South Austin', state: 'TX' },
  '78746': { city: 'West Lake Hills', state: 'TX' },
  
  // Colorado
  '80202': { city: 'Denver', state: 'CO' },
  '80203': { city: 'Denver', state: 'CO' },
  '80204': { city: 'Denver', state: 'CO' },
  '80205': { city: 'Denver', state: 'CO' },
  '80206': { city: 'Denver', state: 'CO' },
  '80209': { city: 'Denver', state: 'CO' },
  '80210': { city: 'Denver', state: 'CO' },
  '80211': { city: 'Denver', state: 'CO' },
  '80218': { city: 'Denver', state: 'CO' },
  '80220': { city: 'Denver', state: 'CO' },
  '80302': { city: 'Boulder', state: 'CO' },
  '80303': { city: 'Boulder', state: 'CO' },
  '80304': { city: 'Boulder', state: 'CO' },
  '81611': { city: 'Aspen', state: 'CO' },
  '81612': { city: 'Aspen', state: 'CO' },
  '81657': { city: 'Vail', state: 'CO' },
  
  // Florida
  '33101': { city: 'Miami', state: 'FL' },
  '33109': { city: 'Miami Beach', state: 'FL' },
  '33125': { city: 'Miami', state: 'FL' },
  '33127': { city: 'Miami', state: 'FL' },
  '33129': { city: 'Miami', state: 'FL' },
  '33130': { city: 'Brickell', state: 'FL' },
  '33131': { city: 'Brickell', state: 'FL' },
  '33132': { city: 'Downtown Miami', state: 'FL' },
  '33133': { city: 'Coconut Grove', state: 'FL' },
  '33134': { city: 'Coral Gables', state: 'FL' },
  '33139': { city: 'South Beach', state: 'FL' },
  '33140': { city: 'Miami Beach', state: 'FL' },
  '33141': { city: 'Miami Beach', state: 'FL' },
  '33143': { city: 'South Miami', state: 'FL' },
  '33146': { city: 'Coral Gables', state: 'FL' },
  '33149': { city: 'Key Biscayne', state: 'FL' },
  
  // Massachusetts
  '02108': { city: 'Boston', state: 'MA' },
  '02109': { city: 'Boston', state: 'MA' },
  '02110': { city: 'Boston', state: 'MA' },
  '02111': { city: 'Boston', state: 'MA' },
  '02114': { city: 'Beacon Hill', state: 'MA' },
  '02115': { city: 'Boston', state: 'MA' },
  '02116': { city: 'Back Bay', state: 'MA' },
  '02118': { city: 'South End', state: 'MA' },
  '02127': { city: 'South Boston', state: 'MA' },
  '02129': { city: 'Charlestown', state: 'MA' },
  '02130': { city: 'Jamaica Plain', state: 'MA' },
  '02134': { city: 'Allston', state: 'MA' },
  '02135': { city: 'Brighton', state: 'MA' },
  '02138': { city: 'Cambridge', state: 'MA' },
  '02139': { city: 'Cambridge', state: 'MA' },
  '02140': { city: 'Cambridge', state: 'MA' },
  '02141': { city: 'Cambridge', state: 'MA' },
  '02142': { city: 'Cambridge', state: 'MA' },
  '02143': { city: 'Somerville', state: 'MA' },
  '02144': { city: 'Somerville', state: 'MA' },
  '02145': { city: 'Somerville', state: 'MA' },
  
  // Washington DC area
  '20001': { city: 'Washington', state: 'DC' },
  '20002': { city: 'Washington', state: 'DC' },
  '20003': { city: 'Capitol Hill', state: 'DC' },
  '20004': { city: 'Washington', state: 'DC' },
  '20005': { city: 'Washington', state: 'DC' },
  '20006': { city: 'Washington', state: 'DC' },
  '20007': { city: 'Georgetown', state: 'DC' },
  '20008': { city: 'Washington', state: 'DC' },
  '20009': { city: 'Adams Morgan', state: 'DC' },
  '20010': { city: 'Columbia Heights', state: 'DC' },
  '20011': { city: 'Washington', state: 'DC' },
  '20015': { city: 'Chevy Chase', state: 'DC' },
  '20016': { city: 'Washington', state: 'DC' },
  '20036': { city: 'Dupont Circle', state: 'DC' },
  '22201': { city: 'Arlington', state: 'VA' },
  '22202': { city: 'Arlington', state: 'VA' },
  '22203': { city: 'Arlington', state: 'VA' },
  '22204': { city: 'Arlington', state: 'VA' },
  '22205': { city: 'Arlington', state: 'VA' },
  '22206': { city: 'Arlington', state: 'VA' },
  '22207': { city: 'Arlington', state: 'VA' },
  '22209': { city: 'Rosslyn', state: 'VA' },
  '20814': { city: 'Bethesda', state: 'MD' },
  '20815': { city: 'Chevy Chase', state: 'MD' },
  '20816': { city: 'Bethesda', state: 'MD' },
  '20817': { city: 'Bethesda', state: 'MD' },
  
  // Illinois
  '60601': { city: 'Chicago', state: 'IL' },
  '60602': { city: 'Chicago', state: 'IL' },
  '60603': { city: 'Chicago', state: 'IL' },
  '60604': { city: 'Chicago', state: 'IL' },
  '60605': { city: 'Chicago', state: 'IL' },
  '60606': { city: 'Chicago', state: 'IL' },
  '60607': { city: 'West Loop', state: 'IL' },
  '60608': { city: 'Pilsen', state: 'IL' },
  '60610': { city: 'Old Town', state: 'IL' },
  '60611': { city: 'Streeterville', state: 'IL' },
  '60612': { city: 'West Town', state: 'IL' },
  '60613': { city: 'Lakeview', state: 'IL' },
  '60614': { city: 'Lincoln Park', state: 'IL' },
  '60615': { city: 'Hyde Park', state: 'IL' },
  '60616': { city: 'South Loop', state: 'IL' },
  '60618': { city: 'North Center', state: 'IL' },
  '60622': { city: 'Wicker Park', state: 'IL' },
  '60625': { city: 'Lincoln Square', state: 'IL' },
  '60626': { city: 'Rogers Park', state: 'IL' },
  '60640': { city: 'Uptown', state: 'IL' },
  '60647': { city: 'Logan Square', state: 'IL' },
  '60657': { city: 'Lakeview', state: 'IL' },
  
  // Washington State
  '98101': { city: 'Seattle', state: 'WA' },
  '98102': { city: 'Capitol Hill', state: 'WA' },
  '98103': { city: 'Fremont', state: 'WA' },
  '98104': { city: 'Seattle', state: 'WA' },
  '98105': { city: 'University District', state: 'WA' },
  '98107': { city: 'Ballard', state: 'WA' },
  '98109': { city: 'Queen Anne', state: 'WA' },
  '98112': { city: 'Madison Park', state: 'WA' },
  '98115': { city: 'Ravenna', state: 'WA' },
  '98116': { city: 'West Seattle', state: 'WA' },
  '98117': { city: 'Ballard', state: 'WA' },
  '98118': { city: 'Columbia City', state: 'WA' },
  '98119': { city: 'Queen Anne', state: 'WA' },
  '98122': { city: 'Central District', state: 'WA' },
  '98144': { city: 'Beacon Hill', state: 'WA' },
  '98199': { city: 'Magnolia', state: 'WA' },
}

/**
 * Get city and state from zip code
 * Returns formatted "City, ST" or just the zip if not found
 */
export function formatLocation(location: string): string {
  if (!location) return 'Location not set'
  
  // Clean the input
  const cleaned = location.trim()
  
  // Check if it's a 5-digit zip code
  const zipMatch = cleaned.match(/^(\d{5})/)
  
  if (zipMatch) {
    const zip = zipMatch[1]
    const info = ZIP_DATABASE[zip]
    
    if (info) {
      return `${info.city}, ${info.state}`
    }
    
    // Return zip with prefix context if not in database
    return `ZIP ${zip}`
  }
  
  // If it already looks like "City, ST" format, return as-is
  if (/^[A-Za-z\s]+,\s*[A-Z]{2}$/.test(cleaned)) {
    return cleaned
  }
  
  // Return as-is for other formats
  return cleaned
}

/**
 * Get just the zip prefix (first 3 digits) for distance grouping
 */
export function getZipPrefix(location: string): string {
  const match = location?.match(/(\d{3})\d{2}/)
  return match ? match[1] : ''
}

/**
 * Check if two locations are in the same general area (same zip prefix)
 */
export function isSameArea(location1: string, location2: string): boolean {
  const prefix1 = getZipPrefix(location1)
  const prefix2 = getZipPrefix(location2)
  
  if (!prefix1 || !prefix2) return false
  return prefix1 === prefix2
}

/**
 * Estimate distance category based on zip prefixes
 * Returns 'local' (same prefix), 'nearby' (adjacent state), or 'travel'
 */
export function getDistanceCategory(userLocation: string, memberLocation: string): 'local' | 'nearby' | 'travel' {
  const userPrefix = getZipPrefix(userLocation)
  const memberPrefix = getZipPrefix(memberLocation)
  
  if (!userPrefix || !memberPrefix) return 'travel'
  
  if (userPrefix === memberPrefix) return 'local'
  
  // Check if first 2 digits match (same general region)
  if (userPrefix.substring(0, 2) === memberPrefix.substring(0, 2)) return 'nearby'
  
  return 'travel'
}