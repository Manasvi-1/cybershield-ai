import {
  users,
  threats,
  phishingAnalysis,
  deepfakeAnalysis,
  honeypotLogs,
  alerts,
  systemStats,
  type User,
  type InsertUser,
  type Threat,
  type InsertThreat,
  type PhishingAnalysis,
  type InsertPhishingAnalysis,
  type DeepfakeAnalysis,
  type InsertDeepfakeAnalysis,
  type HoneypotLog,
  type InsertHoneypotLog,
  type Alert,
  type InsertAlert,
  type SystemStats,
  type InsertSystemStats,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Threats
  getThreats(limit?: number, offset?: number): Promise<Threat[]>;
  getThreatsByType(type: string): Promise<Threat[]>;
  createThreat(threat: InsertThreat): Promise<Threat>;
  updateThreatStatus(id: number, status: string): Promise<void>;

  // Phishing Analysis
  getPhishingAnalyses(limit?: number): Promise<PhishingAnalysis[]>;
  createPhishingAnalysis(analysis: InsertPhishingAnalysis): Promise<PhishingAnalysis>;

  // Deepfake Analysis
  getDeepfakeAnalyses(limit?: number): Promise<DeepfakeAnalysis[]>;
  createDeepfakeAnalysis(analysis: InsertDeepfakeAnalysis): Promise<DeepfakeAnalysis>;

  // Honeypot Logs
  getHoneypotLogs(limit?: number, service?: string): Promise<HoneypotLog[]>;
  createHoneypotLog(log: InsertHoneypotLog): Promise<HoneypotLog>;
  getHoneypotStats(): Promise<{ ssh: number; http: number; ftp: number }>;

  // Alerts
  getAlerts(limit?: number, unreadOnly?: boolean): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<void>;
  markAllAlertsAsRead(): Promise<void>;
  getAlertCounts(): Promise<{ critical: number; high: number; medium: number; low: number }>;

  // System Stats
  getSystemStats(): Promise<SystemStats | undefined>;
  updateSystemStats(stats: Partial<InsertSystemStats>): Promise<SystemStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private threats: Map<number, Threat> = new Map();
  private phishingAnalyses: Map<number, PhishingAnalysis> = new Map();
  private deepfakeAnalyses: Map<number, DeepfakeAnalysis> = new Map();
  private honeypotLogs: Map<number, HoneypotLog> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private systemStats: SystemStats | undefined;
  
  private currentUserId = 1;
  private currentThreatId = 1;
  private currentPhishingId = 1;
  private currentDeepfakeId = 1;
  private currentHoneypotId = 1;
  private currentAlertId = 1;

  constructor() {
    // Initialize with default system stats
    this.systemStats = {
      id: 1,
      activeThreats: 7,
      phishingBlocked: 142,
      deepfakesDetected: 23,
      honeypotHits: 89,
      updatedAt: new Date(),
    };
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.currentUserId++ };
    this.users.set(user.id, user);
    return user;
  }

  // Threats
  async getThreats(limit = 50, offset = 0): Promise<Threat[]> {
    const allThreats = Array.from(this.threats.values())
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    return allThreats.slice(offset, offset + limit);
  }

  async getThreatsByType(type: string): Promise<Threat[]> {
    return Array.from(this.threats.values()).filter(threat => threat.type === type);
  }

  async createThreat(insertThreat: InsertThreat): Promise<Threat> {
    const threat: Threat = {
      id: this.currentThreatId++,
      type: insertThreat.type,
      severity: insertThreat.severity,
      source: insertThreat.source,
      description: insertThreat.description,
      metadata: insertThreat.metadata || null,
      status: insertThreat.status || 'active',
      detectedAt: new Date(),
    };
    this.threats.set(threat.id, threat);
    return threat;
  }

  async updateThreatStatus(id: number, status: string): Promise<void> {
    const threat = this.threats.get(id);
    if (threat) {
      threat.status = status;
      this.threats.set(id, threat);
    }
  }

  // Phishing Analysis
  async getPhishingAnalyses(limit = 50): Promise<PhishingAnalysis[]> {
    const analyses = Array.from(this.phishingAnalyses.values())
      .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime());
    return analyses.slice(0, limit);
  }

  async createPhishingAnalysis(insertAnalysis: InsertPhishingAnalysis): Promise<PhishingAnalysis> {
    const analysis: PhishingAnalysis = {
      id: this.currentPhishingId++,
      content: insertAnalysis.content,
      score: insertAnalysis.score,
      confidence: insertAnalysis.confidence,
      suspiciousLinks: insertAnalysis.suspiciousLinks || 0,
      indicators: insertAnalysis.indicators || null,
      analyzedAt: new Date(),
    };
    this.phishingAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  // Deepfake Analysis
  async getDeepfakeAnalyses(limit = 50): Promise<DeepfakeAnalysis[]> {
    const analyses = Array.from(this.deepfakeAnalyses.values())
      .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime());
    return analyses.slice(0, limit);
  }

  async createDeepfakeAnalysis(insertAnalysis: InsertDeepfakeAnalysis): Promise<DeepfakeAnalysis> {
    const analysis: DeepfakeAnalysis = {
      id: this.currentDeepfakeId++,
      fileName: insertAnalysis.fileName,
      fileType: insertAnalysis.fileType,
      fileSize: insertAnalysis.fileSize,
      isDeepfake: insertAnalysis.isDeepfake,
      confidence: insertAnalysis.confidence,
      processingTime: insertAnalysis.processingTime,
      anomalies: insertAnalysis.anomalies || null,
      analyzedAt: new Date(),
    };
    this.deepfakeAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  // Honeypot Logs
  async getHoneypotLogs(limit = 100, service?: string): Promise<HoneypotLog[]> {
    let logs = Array.from(this.honeypotLogs.values());
    if (service) {
      logs = logs.filter(log => log.service === service);
    }
    return logs
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  async createHoneypotLog(insertLog: InsertHoneypotLog): Promise<HoneypotLog> {
    const log: HoneypotLog = {
      id: this.currentHoneypotId++,
      service: insertLog.service,
      sourceIp: insertLog.sourceIp,
      attackType: insertLog.attackType,
      severity: insertLog.severity,
      port: insertLog.port,
      payload: insertLog.payload || null,
      location: insertLog.location || null,
      detectedAt: new Date(),
    };
    this.honeypotLogs.set(log.id, log);
    return log;
  }

  async getHoneypotStats(): Promise<{ ssh: number; http: number; ftp: number }> {
    const logs = Array.from(this.honeypotLogs.values());
    return {
      ssh: logs.filter(log => log.service === 'ssh').length,
      http: logs.filter(log => log.service === 'http').length,
      ftp: logs.filter(log => log.service === 'ftp').length,
    };
  }

  // Alerts
  async getAlerts(limit = 50, unreadOnly = false): Promise<Alert[]> {
    let alertList = Array.from(this.alerts.values());
    if (unreadOnly) {
      alertList = alertList.filter(alert => !alert.isRead);
    }
    return alertList
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = {
      id: this.currentAlertId++,
      title: insertAlert.title,
      description: insertAlert.description,
      severity: insertAlert.severity,
      category: insertAlert.category,
      isRead: insertAlert.isRead || false,
      metadata: insertAlert.metadata || null,
      createdAt: new Date(),
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isRead = true;
      this.alerts.set(id, alert);
    }
  }

  async markAllAlertsAsRead(): Promise<void> {
    const alerts = Array.from(this.alerts.values());
    for (const alert of alerts) {
      alert.isRead = true;
      this.alerts.set(alert.id, alert);
    }
  }

  async getAlertCounts(): Promise<{ critical: number; high: number; medium: number; low: number }> {
    const unreadAlerts = Array.from(this.alerts.values()).filter(alert => !alert.isRead);
    return {
      critical: unreadAlerts.filter(alert => alert.severity === 'critical').length,
      high: unreadAlerts.filter(alert => alert.severity === 'high').length,
      medium: unreadAlerts.filter(alert => alert.severity === 'medium').length,
      low: unreadAlerts.filter(alert => alert.severity === 'low').length,
    };
  }

  // System Stats
  async getSystemStats(): Promise<SystemStats | undefined> {
    return this.systemStats;
  }

  async updateSystemStats(stats: Partial<InsertSystemStats>): Promise<SystemStats> {
    if (this.systemStats) {
      this.systemStats = {
        ...this.systemStats,
        ...stats,
        updatedAt: new Date(),
      };
    } else {
      this.systemStats = {
        id: 1,
        activeThreats: 0,
        phishingBlocked: 0,
        deepfakesDetected: 0,
        honeypotHits: 0,
        ...stats,
        updatedAt: new Date(),
      };
    }
    return this.systemStats;
  }
}

export const storage = new MemStorage();
