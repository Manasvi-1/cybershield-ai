interface GeoLocation {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  region_name: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export class GeolocationService {
  private cache = new Map<string, GeoLocation>();
  private readonly apiUrl = 'http://ip-api.com/json';

  async getLocation(ip: string): Promise<GeoLocation | null> {
    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip)!;
    }

    try {
      const response = await fetch(`${this.apiUrl}/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'fail') {
        console.warn(`Geolocation failed for IP ${ip}: ${data.message}`);
        return null;
      }

      const location: GeoLocation = {
        ip: data.query || ip,
        country: data.country || 'Unknown',
        country_code: data.countryCode || 'XX',
        region: data.region || '',
        region_name: data.regionName || '',
        city: data.city || 'Unknown',
        zip: data.zip || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || 'Unknown ISP',
        org: data.org || 'Unknown Organization',
        as: data.as || 'Unknown AS'
      };

      // Cache the result
      this.cache.set(ip, location);
      
      return location;
    } catch (error) {
      console.error(`Failed to get geolocation for IP ${ip}:`, error);
      return null;
    }
  }

  async batchGetLocations(ips: string[]): Promise<Map<string, GeoLocation>> {
    const results = new Map<string, GeoLocation>();
    
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const promises = batch.map(ip => this.getLocation(ip));
      
      const locations = await Promise.all(promises);
      
      batch.forEach((ip, index) => {
        if (locations[index]) {
          results.set(ip, locations[index]!);
        }
      });

      // Rate limiting delay
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  getCachedLocation(ip: string): GeoLocation | null {
    return this.cache.get(ip) || null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const geolocationService = new GeolocationService();