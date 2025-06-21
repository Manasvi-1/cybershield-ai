export interface SystemStats {
  id: number;
  activeThreats: number;
  phishingBlocked: number;
  deepfakesDetected: number;
  honeypotHits: number;
  updatedAt: Date;
}

export interface PhishingAnalysisResult {
  score: number;
  confidence: number;
  suspiciousLinks: number;
  indicators: string[];
}

export interface DeepfakeAnalysisResult {
  isDeepfake: boolean;
  confidence: number;
  processingTime: number;
  anomalies: string[];
}

export interface HoneypotStats {
  ssh: number;
  http: number;
  ftp: number;
}

export interface AlertCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'email' | 'media' | 'honeypot' | 'system';
  isRead: boolean;
  metadata: any;
  createdAt: Date;
}

export interface Threat {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  metadata: any;
  status: string;
  detectedAt: Date;
}

export interface HoneypotLog {
  id: number;
  service: string;
  sourceIp: string;
  attackType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  port: number;
  payload?: string;
  location: any;
  detectedAt: Date;
}

export interface PhishingAnalysis {
  id: number;
  content: string;
  score: number;
  confidence: number;
  suspiciousLinks: number;
  indicators: any;
  analyzedAt: Date;
}

export interface DeepfakeAnalysis {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  isDeepfake: boolean;
  confidence: number;
  processingTime: number;
  anomalies: any;
  analyzedAt: Date;
}

export interface WebSocketMessage {
  type: 'new_alert' | 'honeypot_attack' | 'stats_update';
  [key: string]: any;
}
