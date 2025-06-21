import { EventEmitter } from 'events';
import { storage } from '../storage';
import { geolocationService } from '../services/geolocation';
import { emailAlertService, type EmailAlertData } from '../services/email-alerts';

export interface HoneypotAttack {
  service: string;
  sourceIp: string;
  attackType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  port: number;
  payload?: string;
}

export class HoneypotManager extends EventEmitter {
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting honeypot services...');
    
    // Start SSH honeypot simulation
    this.intervals.push(setInterval(() => this.simulateSSHAttack(), 10000 + Math.random() * 20000));
    
    // Start HTTP honeypot simulation
    this.intervals.push(setInterval(() => this.simulateHTTPAttack(), 8000 + Math.random() * 15000));
    
    // Start FTP honeypot simulation
    this.intervals.push(setInterval(() => this.simulateFTPAttack(), 15000 + Math.random() * 30000));
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('Stopped honeypot services');
  }

  private async simulateSSHAttack() {
    const attackTypes = ['Brute Force', 'Dictionary Attack', 'Credential Stuffing'];
    const sourceIps = this.generateRandomIPs(5);
    
    const attack: HoneypotAttack = {
      service: 'ssh',
      sourceIp: sourceIps[Math.floor(Math.random() * sourceIps.length)],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(['medium', 'high']),
      port: 22,
      payload: `Failed login attempts: ${Math.floor(Math.random() * 50) + 1}`
    };

    await this.logAttack(attack);
    this.emit('attack', attack);
  }

  private async simulateHTTPAttack() {
    const attackTypes = ['Web Crawler', 'SQL Injection', 'XSS Attempt', 'Directory Traversal'];
    const sourceIps = this.generateRandomIPs(10);
    
    const attack: HoneypotAttack = {
      service: 'http',
      sourceIp: sourceIps[Math.floor(Math.random() * sourceIps.length)],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(['low', 'medium']),
      port: Math.random() < 0.5 ? 80 : 8080,
      payload: `User-Agent: ${this.getRandomUserAgent()}`
    };

    await this.logAttack(attack);
    this.emit('attack', attack);
  }

  private async simulateFTPAttack() {
    const attackTypes = ['Login Attempt', 'Anonymous Access', 'File Enumeration'];
    const sourceIps = this.generateRandomIPs(3);
    
    const attack: HoneypotAttack = {
      service: 'ftp',
      sourceIp: sourceIps[Math.floor(Math.random() * sourceIps.length)],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(['low', 'medium']),
      port: 21,
      payload: `Connection attempts: ${Math.floor(Math.random() * 10) + 1}`
    };

    await this.logAttack(attack);
    this.emit('attack', attack);
  }

  private async logAttack(attack: HoneypotAttack) {
    try {
      // Get real geolocation data
      const location = await geolocationService.getLocation(attack.sourceIp);
      
      await storage.createHoneypotLog({
        service: attack.service,
        sourceIp: attack.sourceIp,
        attackType: attack.attackType,
        severity: attack.severity,
        port: attack.port,
        payload: attack.payload || '',
        location: location
      });

      // Send email alert for SSH attacks
      if (attack.service === 'ssh' && (attack.severity === 'high' || attack.severity === 'critical')) {
        const emailData: EmailAlertData = {
          attackerIp: attack.sourceIp,
          country: location?.country || 'Unknown',
          city: location?.city || 'Unknown',
          attackType: attack.attackType,
          timestamp: new Date(),
          attempts: parseInt(attack.payload?.match(/\d+/)?.[0] || '1')
        };
        
        await emailAlertService.sendAttackAlert(emailData);
      }

      // Update system stats
      const stats = await storage.getSystemStats();
      if (stats) {
        await storage.updateSystemStats({
          honeypotHits: stats.honeypotHits + 1
        });
      }
    } catch (error) {
      console.error('Failed to log honeypot attack:', error);
    }
  }

  private generateRandomIPs(count: number): string[] {
    const ips: string[] = [];
    for (let i = 0; i < count; i++) {
      const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      ips.push(ip);
    }
    return ips;
  }

  private getRandomSeverity(severities: string[]): 'low' | 'medium' | 'high' | 'critical' {
    return severities[Math.floor(Math.random() * severities.length)] as 'low' | 'medium' | 'high' | 'critical';
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (compatible; Baiduspider/2.0)',
      'Mozilla/5.0 (compatible; Googlebot/2.1)',
      'curl/7.68.0',
      'python-requests/2.25.1',
      'Wget/1.20.3',
      'sqlmap/1.4.7'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private getGeoLocation(ip: string): any {
    // Enhanced geolocation data
    const locations = [
      { country: 'China', country_code: 'CN', city: 'Beijing', lat: 39.9042, lon: 116.4074, isp: 'China Telecom' },
      { country: 'Russia', country_code: 'RU', city: 'Moscow', lat: 55.7558, lon: 37.6176, isp: 'Rostelecom' },
      { country: 'United States', country_code: 'US', city: 'New York', lat: 40.7128, lon: -74.0060, isp: 'Verizon' },
      { country: 'Brazil', country_code: 'BR', city: 'São Paulo', lat: -23.5505, lon: -46.6333, isp: 'Telecom Brasil' },
      { country: 'India', country_code: 'IN', city: 'Mumbai', lat: 19.0760, lon: 72.8777, isp: 'Airtel' },
      { country: 'Germany', country_code: 'DE', city: 'Berlin', lat: 52.5200, lon: 13.4050, isp: 'Deutsche Telekom' },
      { country: 'Netherlands', country_code: 'NL', city: 'Amsterdam', lat: 52.3676, lon: 4.9041, isp: 'KPN' },
      { country: 'Ukraine', country_code: 'UA', city: 'Kiev', lat: 50.4501, lon: 30.5234, isp: 'Ukrtelecom' },
      { country: 'Romania', country_code: 'RO', city: 'Bucharest', lat: 44.4268, lon: 26.1025, isp: 'RCS & RDS' },
      { country: 'Vietnam', country_code: 'VN', city: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, isp: 'VNPT' }
    ];
    const selected = locations[Math.floor(Math.random() * locations.length)];
    return {
      ip,
      country: selected.country,
      country_code: selected.country_code,
      city: selected.city,
      lat: selected.lat + (Math.random() - 0.5) * 0.5,
      lon: selected.lon + (Math.random() - 0.5) * 0.5,
      isp: selected.isp
    };
  }
}

export const honeypotManager = new HoneypotManager();
