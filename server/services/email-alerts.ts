import { MailService } from '@sendgrid/mail';

export interface EmailAlertData {
  attackerIp: string;
  country: string;
  city: string;
  attackType: string;
  timestamp: Date;
  attempts: number;
}

export class EmailAlertService {
  private mailService: MailService;
  private isConfigured = false;

  constructor() {
    this.mailService = new MailService();
    this.configure();
  }

  private configure() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      this.mailService.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('Email alert service configured with SendGrid');
    } else {
      console.warn('SENDGRID_API_KEY not found. Email alerts will be simulated.');
    }
  }

  async sendAttackAlert(alertData: EmailAlertData): Promise<boolean> {
    if (!this.isConfigured) {
      // Simulate email sending when API key is not available
      console.log(`[SIMULATED EMAIL] SSH Attack Alert:
        - Attacker IP: ${alertData.attackerIp}
        - Location: ${alertData.city}, ${alertData.country}
        - Attack Type: ${alertData.attackType}
        - Attempts: ${alertData.attempts}
        - Time: ${alertData.timestamp.toISOString()}`);
      return true;
    }

    try {
      const msg = {
        to: 'admin@cybershield.ai', // Default admin email
        from: 'alerts@cybershield.ai', // Verified sender email
        subject: `🚨 SSH Honeypot Attack Alert - ${alertData.attackerIp}`,
        html: this.generateEmailTemplate(alertData),
        text: this.generateTextVersion(alertData)
      };

      await this.mailService.send(msg);
      console.log(`Email alert sent for attack from ${alertData.attackerIp}`);
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  private generateEmailTemplate(data: EmailAlertData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #0f1419; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1f2e; border-radius: 8px; padding: 30px; }
          .header { text-align: center; margin-bottom: 30px; }
          .alert-icon { font-size: 48px; margin-bottom: 10px; }
          .title { color: #ef4444; font-size: 24px; font-weight: bold; margin: 0; }
          .subtitle { color: #94a3b8; font-size: 16px; margin: 5px 0 0 0; }
          .details { background-color: #0f1419; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { color: #94a3b8; font-weight: bold; }
          .value { color: #ffffff; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .urgent { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">🚨</div>
            <h1 class="title">SSH Honeypot Attack Detected</h1>
            <p class="subtitle">Immediate attention required</p>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Attacker IP:</span>
              <span class="value urgent">${data.attackerIp}</span>
            </div>
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">${data.city}, ${data.country}</span>
            </div>
            <div class="detail-row">
              <span class="label">Attack Type:</span>
              <span class="value">${data.attackType}</span>
            </div>
            <div class="detail-row">
              <span class="label">Login Attempts:</span>
              <span class="value">${data.attempts}</span>
            </div>
            <div class="detail-row">
              <span class="label">Timestamp:</span>
              <span class="value">${data.timestamp.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from CyberShield AI Honeypot System</p>
            <p>Please review your security logs and take appropriate action</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTextVersion(data: EmailAlertData): string {
    return `
SSH HONEYPOT ATTACK ALERT

Attacker IP: ${data.attackerIp}
Location: ${data.city}, ${data.country}
Attack Type: ${data.attackType}
Login Attempts: ${data.attempts}
Timestamp: ${data.timestamp.toLocaleString()}

This is an automated alert from CyberShield AI Honeypot System.
Please review your security logs and take appropriate action.
    `.trim();
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

export const emailAlertService = new EmailAlertService();