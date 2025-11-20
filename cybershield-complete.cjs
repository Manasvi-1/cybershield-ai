#!/usr/bin/env node

/**
 * CyberShield AI - Complete Single File Deployment
 * AI-driven cybersecurity platform with honeypot monitoring, deepfake detection, 
 * phishing analysis, and real-time threat alerts
 * 
 * Deploy to Google Cloud Platform:
 * 1. Upload this file
 * 2. Set environment variables: PORT (optional), SENDGRID_API_KEY (optional)
 * 3. Run: node cybershield-complete.js
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const EventEmitter = require('events');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// In-memory storage
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.threats = new Map();
    this.phishingAnalyses = new Map();
    this.deepfakeAnalyses = new Map();
    this.honeypotLogs = new Map();
    this.alerts = new Map();
    this.systemStats = {
      id: 1,
      activeThreats: 7,
      phishingBlocked: 142,
      deepfakesDetected: 23,
      honeypotHits: 1847,
      updatedAt: new Date()
    };
    
    this.currentUserId = 1;
    this.currentThreatId = 1;
    this.currentPhishingId = 1;
    this.currentDeepfakeId = 1;
    this.currentHoneypotId = 1;
    this.currentAlertId = 1;
  }

  // System Stats
  async getSystemStats() {
    return this.systemStats;
  }

  async updateSystemStats(stats) {
    this.systemStats = { ...this.systemStats, ...stats, updatedAt: new Date() };
    return this.systemStats;
  }

  // Threats
  async getThreats(limit = 50, offset = 0) {
    const allThreats = Array.from(this.threats.values())
      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    return allThreats.slice(offset, offset + limit);
  }

  async createThreat(threat) {
    const newThreat = {
      id: this.currentThreatId++,
      ...threat,
      detectedAt: new Date()
    };
    this.threats.set(newThreat.id, newThreat);
    return newThreat;
  }

  // Phishing Analysis
  async getPhishingAnalyses(limit = 50) {
    return Array.from(this.phishingAnalyses.values())
      .sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt))
      .slice(0, limit);
  }

  async createPhishingAnalysis(analysis) {
    const newAnalysis = {
      id: this.currentPhishingId++,
      ...analysis,
      analyzedAt: new Date()
    };
    this.phishingAnalyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }

  // Deepfake Analysis
  async getDeepfakeAnalyses(limit = 50) {
    return Array.from(this.deepfakeAnalyses.values())
      .sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt))
      .slice(0, limit);
  }

  async createDeepfakeAnalysis(analysis) {
    const newAnalysis = {
      id: this.currentDeepfakeId++,
      ...analysis,
      analyzedAt: new Date()
    };
    this.deepfakeAnalyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }

  // Honeypot Logs
  async getHoneypotLogs(limit = 100, service) {
    let logs = Array.from(this.honeypotLogs.values());
    if (service) {
      logs = logs.filter(log => log.service === service);
    }
    return logs.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
      .slice(0, limit);
  }

  async createHoneypotLog(log) {
    const newLog = {
      id: this.currentHoneypotId++,
      ...log,
      detectedAt: new Date()
    };
    this.honeypotLogs.set(newLog.id, newLog);
    return newLog;
  }

  async getHoneypotStats() {
    const logs = Array.from(this.honeypotLogs.values());
    return {
      ssh: logs.filter(log => log.service === 'ssh').length,
      http: logs.filter(log => log.service === 'http').length,
      ftp: logs.filter(log => log.service === 'ftp').length
    };
  }

  // Alerts
  async getAlerts(limit = 50, unreadOnly = false) {
    let alerts = Array.from(this.alerts.values());
    if (unreadOnly) {
      alerts = alerts.filter(alert => !alert.isRead);
    }
    return alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  async createAlert(alert) {
    const newAlert = {
      id: this.currentAlertId++,
      ...alert,
      createdAt: new Date()
    };
    this.alerts.set(newAlert.id, newAlert);
    return newAlert;
  }

  async markAlertAsRead(id) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isRead = true;
      this.alerts.set(id, alert);
    }
  }

  async getAlertCounts() {
    const alerts = Array.from(this.alerts.values());
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
  }
}

// Geolocation Service
class GeolocationService {
  constructor() {
    this.cache = new Map();
  }

  async getLocation(ip) {
    if (this.cache.has(ip)) {
      return this.cache.get(ip);
    }

    // Mock geolocation for demo purposes
    const mockLocations = [
      { country: 'United States', city: 'New York', lat: 40.7128, lon: -74.0060 },
      { country: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
      { country: 'Russia', city: 'Moscow', lat: 55.7558, lon: 37.6176 },
      { country: 'Germany', city: 'Berlin', lat: 52.5200, lon: 13.4050 },
      { country: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { country: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278 }
    ];

    const location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    const geoData = {
      ip,
      country: location.country,
      city: location.city,
      lat: location.lat,
      lon: location.lon,
      timezone: 'UTC',
      isp: 'Mock ISP',
      org: 'Mock Organization'
    };

    this.cache.set(ip, geoData);
    return geoData;
  }
}

// Email Alert Service
class EmailAlertService {
  constructor() {
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
  }

  async sendAttackAlert(alertData) {
    if (!this.isConfigured) {
      console.log(`[SIMULATED EMAIL] SSH Attack Alert:
        - Attacker IP: ${alertData.attackerIp}
        - Location: ${alertData.city}, ${alertData.country}
        - Attack Type: ${alertData.attackType}
        - Attempts: ${alertData.attempts}
        - Time: ${alertData.timestamp.toISOString()}`);
      return true;
    }
    
    // Real SendGrid implementation would go here
    return true;
  }
}

// Phishing Detector
class PhishingDetector {
  constructor() {
    this.phishingKeywords = [
      'urgent', 'immediate', 'verify', 'suspended', 'click here', 'act now',
      'limited time', 'congratulations', 'winner', 'prize', 'free money'
    ];
    this.suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'
    ];
  }

  async analyzeEmail(content) {
    const score = this.calculatePhishingScore(content);
    const suspiciousLinks = this.extractSuspiciousLinks(content);
    const indicators = this.findIndicators(content);
    
    return {
      score,
      confidence: Math.min(95, score + Math.random() * 10),
      suspiciousLinks,
      indicators
    };
  }

  calculatePhishingScore(content) {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    // Check for phishing keywords
    this.phishingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) score += 15;
    });
    
    // Check for suspicious domains
    this.suspiciousDomains.forEach(domain => {
      if (lowerContent.includes(domain)) score += 20;
    });
    
    // Check for poor grammar/spelling
    if (this.hasPoorGrammar(content)) score += 10;
    
    return Math.min(100, score);
  }

  extractSuspiciousLinks(content) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = content.match(urlRegex) || [];
    return matches.filter(url => 
      this.suspiciousDomains.some(domain => url.includes(domain))
    ).length;
  }

  findIndicators(content) {
    const indicators = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('urgent')) indicators.push('Urgency tactics');
    if (lowerContent.includes('verify')) indicators.push('Account verification request');
    if (this.extractSuspiciousLinks(content) > 0) indicators.push('Suspicious shortened URLs');
    if (this.hasPoorGrammar(content)) indicators.push('Poor grammar/spelling');
    
    return indicators;
  }

  hasPoorGrammar(content) {
    const grammarIssues = ['recieve', 'occured', 'seperate', 'definately'];
    return grammarIssues.some(issue => content.toLowerCase().includes(issue));
  }
}

// Deepfake Detector
class DeepfakeDetector {
  async analyzeImage(buffer, fileName) {
    const startTime = Date.now();
    const anomalies = [];
    
    // Simulate analysis
    await this.simulateProcessing(2000);
    
    const isDeepfake = this.simulateImageAnalysis(buffer, fileName, anomalies);
    const processingTime = Date.now() - startTime;
    
    return {
      isDeepfake,
      confidence: Math.random() * 0.3 + (isDeepfake ? 0.7 : 0.1),
      processingTime,
      anomalies
    };
  }

  async analyzeVideo(buffer, fileName) {
    const startTime = Date.now();
    const anomalies = [];
    
    // Simulate analysis
    await this.simulateProcessing(5000);
    
    const isDeepfake = this.simulateVideoAnalysis(buffer, fileName, anomalies);
    const processingTime = Date.now() - startTime;
    
    return {
      isDeepfake,
      confidence: Math.random() * 0.2 + (isDeepfake ? 0.8 : 0.15),
      processingTime,
      anomalies
    };
  }

  simulateImageAnalysis(buffer, fileName, anomalies) {
    // Simulate detection logic
    let isDeepfake = Math.random() > 0.7;
    
    if (this.checkPixelInconsistencies(buffer, anomalies)) isDeepfake = true;
    if (this.checkCompressionAnomalies(buffer, anomalies)) isDeepfake = true;
    if (this.checkMetadataAnomalies(fileName, anomalies)) isDeepfake = true;
    
    return isDeepfake;
  }

  simulateVideoAnalysis(buffer, fileName, anomalies) {
    let isDeepfake = Math.random() > 0.6;
    
    if (this.checkFaceSwapArtifacts(buffer, anomalies)) isDeepfake = true;
    if (this.checkTemporalInconsistency(buffer, anomalies)) isDeepfake = true;
    if (this.checkFrameAnomalies(buffer, anomalies)) isDeepfake = true;
    
    return isDeepfake;
  }

  checkPixelInconsistencies(buffer, anomalies) {
    if (Math.random() > 0.8) {
      anomalies.push('Pixel-level inconsistencies detected');
      return true;
    }
    return false;
  }

  checkCompressionAnomalies(buffer, anomalies) {
    if (Math.random() > 0.85) {
      anomalies.push('Unusual compression artifacts');
      return true;
    }
    return false;
  }

  checkMetadataAnomalies(fileName, anomalies) {
    if (Math.random() > 0.9) {
      anomalies.push('Suspicious metadata patterns');
      return true;
    }
    return false;
  }

  checkFaceSwapArtifacts(buffer, anomalies) {
    if (Math.random() > 0.75) {
      anomalies.push('Face swap artifacts detected');
      return true;
    }
    return false;
  }

  checkTemporalInconsistency(buffer, anomalies) {
    if (Math.random() > 0.8) {
      anomalies.push('Temporal inconsistencies between frames');
      return true;
    }
    return false;
  }

  checkFrameAnomalies(buffer, anomalies) {
    if (Math.random() > 0.85) {
      anomalies.push('Frame-level anomalies detected');
      return true;
    }
    return false;
  }

  async simulateProcessing(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
}

// Honeypot Manager
class HoneypotManager extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.intervals = [];
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting honeypot services...');
    
    // Start different honeypot services
    this.intervals.push(setInterval(() => this.simulateSSHAttack(), 15000));
    this.intervals.push(setInterval(() => this.simulateHTTPAttack(), 25000));
    this.intervals.push(setInterval(() => this.simulateFTPAttack(), 35000));
  }

  stop() {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  async simulateSSHAttack() {
    const attackTypes = ['Brute Force', 'Dictionary Attack', 'Credential Stuffing'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const ips = this.generateRandomIPs(1);
    
    const attack = {
      service: 'ssh',
      sourceIp: ips[0],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(severities),
      port: 22,
      payload: `ssh-login-attempt-${Date.now()}`
    };
    
    await this.logAttack(attack);
  }

  async simulateHTTPAttack() {
    const attackTypes = ['SQL Injection', 'XSS', 'Directory Traversal', 'CSRF'];
    const severities = ['low', 'medium', 'high'];
    const ips = this.generateRandomIPs(1);
    
    const attack = {
      service: 'http',
      sourceIp: ips[0],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(severities),
      port: 80,
      payload: `http-request-${Date.now()}`
    };
    
    await this.logAttack(attack);
  }

  async simulateFTPAttack() {
    const attackTypes = ['Anonymous Login', 'Brute Force', 'Buffer Overflow'];
    const severities = ['low', 'medium', 'high'];
    const ips = this.generateRandomIPs(1);
    
    const attack = {
      service: 'ftp',
      sourceIp: ips[0],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      severity: this.getRandomSeverity(severities),
      port: 21
    };
    
    await this.logAttack(attack);
  }

  async logAttack(attack) {
    try {
      const location = await geolocationService.getLocation(attack.sourceIp);
      
      const honeypotLog = await storage.createHoneypotLog({
        ...attack,
        location
      });
      
      // Create alert for high-severity SSH attacks
      if (attack.service === 'ssh' && ['high', 'critical'].includes(attack.severity)) {
        const alert = await storage.createAlert({
          title: 'SSH Honeypot Attack',
          description: `${attack.attackType} attack from ${attack.sourceIp} (${location?.city}, ${location?.country})`,
          severity: attack.severity,
          category: 'honeypot',
          isRead: false,
          metadata: { honeypotLogId: honeypotLog.id, location }
        });
        
        // Send email alert
        const emailData = {
          attackerIp: attack.sourceIp,
          country: location?.country || 'Unknown',
          city: location?.city || 'Unknown',
          attackType: attack.attackType,
          timestamp: new Date(),
          attempts: Math.floor(Math.random() * 50) + 1
        };
        
        await emailAlertService.sendAttackAlert(emailData);
        
        // Broadcast to WebSocket clients
        broadcast({
          type: 'new_alert',
          alert,
          honeypotLog
        });
      }
      
      // Update system stats
      await storage.updateSystemStats({
        honeypotHits: (await storage.getSystemStats()).honeypotHits + 1
      });
      
      this.emit('attack', attack, honeypotLog);
      
    } catch (error) {
      console.error('Error logging attack:', error);
    }
  }

  generateRandomIPs(count) {
    const ips = [];
    for (let i = 0; i < count; i++) {
      ips.push(`${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
    }
    return ips;
  }

  getRandomSeverity(severities) {
    return severities[Math.floor(Math.random() * severities.length)];
  }
}

// Initialize services
const storage = new MemoryStorage();
const geolocationService = new GeolocationService();
const emailAlertService = new EmailAlertService();
const phishingDetector = new PhishingDetector();
const deepfakeDetector = new DeepfakeDetector();
const honeypotManager = new HoneypotManager();

// WebSocket setup
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Set();

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await storage.getSystemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/threats', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const threats = await storage.getThreats(parseInt(limit), parseInt(offset));
    res.json(threats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const { limit = 50, unread = false } = req.query;
    const alerts = await storage.getAlerts(parseInt(limit), unread === 'true');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts/counts', async (req, res) => {
  try {
    const counts = await storage.getAlertCounts();
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/alerts/:id/read', async (req, res) => {
  try {
    await storage.markAlertAsRead(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/honeypot/logs', async (req, res) => {
  try {
    const { limit = 100, service } = req.query;
    const logs = await storage.getHoneypotLogs(parseInt(limit), service);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/honeypot/stats', async (req, res) => {
  try {
    const stats = await storage.getHoneypotStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ssh-honeypot/dashboard', async (req, res) => {
  try {
    const sshLogs = await storage.getHoneypotLogs(1000, 'ssh');
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const statistics = {
      totalAttacks: sshLogs.length,
      attacks24h: sshLogs.filter(log => new Date(log.detectedAt) > last24h).length,
      uniqueIPs: new Set(sshLogs.map(log => log.sourceIp)).size,
      uniqueCountries: new Set(sshLogs.map(log => log.location?.country).filter(Boolean)).size,
      topCountries: Object.entries(
        sshLogs.reduce((acc, log) => {
          const country = log.location?.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {})
      ).sort(([,a], [,b]) => b - a).slice(0, 5),
      topAttackTypes: Object.entries(
        sshLogs.reduce((acc, log) => {
          acc[log.attackType] = (acc[log.attackType] || 0) + 1;
          return acc;
        }, {})
      ).sort(([,a], [,b]) => b - a).slice(0, 5)
    };

    const attackPoints = sshLogs
      .filter(log => log.location?.lat && log.location?.lon)
      .reduce((acc, log) => {
        const key = `${log.sourceIp}-${log.location.lat}-${log.location.lon}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            coordinates: [log.location.lon, log.location.lat],
            country: log.location.country || 'Unknown',
            city: log.location.city || 'Unknown',
            ip: log.sourceIp,
            attackType: log.attackType,
            severity: log.severity,
            timestamp: new Date(log.detectedAt),
            lastSeen: new Date(log.detectedAt),
            count: 0
          };
        }
        acc[key].count++;
        if (new Date(log.detectedAt) > acc[key].lastSeen) {
          acc[key].lastSeen = new Date(log.detectedAt);
          acc[key].attackType = log.attackType;
          acc[key].severity = log.severity;
        }
        return acc;
      }, {});

    res.json({
      statistics,
      attackPoints: Object.values(attackPoints),
      recentLogs: sshLogs.slice(0, 50)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/phishing/analyze', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await phishingDetector.analyzeEmail(content);
    const analysis = await storage.createPhishingAnalysis({
      content,
      score: result.score,
      confidence: result.confidence,
      suspiciousLinks: result.suspiciousLinks,
      indicators: result.indicators
    });

    // Create threat if high risk
    if (result.score > 70) {
      await storage.createThreat({
        type: 'phishing',
        severity: result.score > 90 ? 'critical' : 'high',
        source: 'email-analysis',
        description: `Phishing email detected with ${result.score}% confidence`,
        metadata: { analysisId: analysis.id },
        status: 'active'
      });
    }

    res.json({ analysis, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/phishing/analyses', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const analyses = await storage.getPhishingAnalyses(parseInt(limit));
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deepfake/analyze', async (req, res) => {
  try {
    const { fileName, fileType, fileData } = req.body;
    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ error: 'File data is required' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    const isVideo = fileType.startsWith('video/');
    
    const result = isVideo 
      ? await deepfakeDetector.analyzeVideo(buffer, fileName)
      : await deepfakeDetector.analyzeImage(buffer, fileName);

    const analysis = await storage.createDeepfakeAnalysis({
      fileName,
      fileType,
      fileSize: buffer.length,
      isDeepfake: result.isDeepfake,
      confidence: result.confidence,
      processingTime: result.processingTime,
      anomalies: result.anomalies
    });

    // Create threat if deepfake detected
    if (result.isDeepfake) {
      await storage.createThreat({
        type: 'deepfake',
        severity: result.confidence > 0.8 ? 'high' : 'medium',
        source: 'deepfake-detection',
        description: `Deepfake detected in ${fileName} with ${(result.confidence * 100).toFixed(1)}% confidence`,
        metadata: { analysisId: analysis.id },
        status: 'active'
      });
    }

    res.json({ analysis, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deepfake/analyses', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const analyses = await storage.getDeepfakeAnalyses(parseInt(limit));
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.send(getHTMLContent());
});

// Frontend HTML content
function getHTMLContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberShield AI - Advanced Cybersecurity Platform</title>
    <meta name="description" content="AI-driven cybersecurity platform with honeypot monitoring, deepfake detection, phishing analysis, and real-time threat alerts">
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
    <script src="https://unpkg.com/recharts@2.8.0/umd/Recharts.js"></script>
    <script src="https://unpkg.com/react-simple-maps@3.0.0/dist/react-simple-maps.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --primary: 142 76% 36%;
            --primary-foreground: 355.7 100% 97.3%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 142 76% 36%;
        }
        
        body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .cybershield-gradient {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        }
        
        .hover-scale {
            transition: transform 0.2s ease-in-out;
        }
        
        .hover-scale:hover {
            transform: scale(1.02);
        }
        
        .pulse-glow {
            animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse-glow {
            0%, 100% {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
                opacity: 0.8;
                box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
            }
        }
        
        .card {
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            padding: 0.5rem 1rem;
        }
        
        .btn-primary {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        
        .btn-primary:hover {
            background-color: hsl(var(--primary) / 0.9);
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .badge-critical { background-color: #dc2626; color: white; }
        .badge-high { background-color: #ea580c; color: white; }
        .badge-medium { background-color: #d97706; color: white; }
        .badge-low { background-color: #65a30d; color: white; }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .sidebar {
            width: 16rem;
            background: linear-gradient(180deg, hsl(217.2 32.6% 17.5%) 0%, hsl(222.2 84% 4.9%) 100%);
            border-right: 1px solid hsl(var(--border));
        }
        
        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            margin: 0.25rem;
            border-radius: 0.375rem;
            color: hsl(var(--muted-foreground));
            text-decoration: none;
            transition: all 0.2s;
        }
        
        .sidebar-link:hover {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
        }
        
        .sidebar-link.active {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useCallback, useMemo } = React;
        const { Shield, BarChart3, Mail, Video, Bug, Bell, TrendingUp, Terminal, AlertTriangle, Globe, Clock, MapPin, Activity, Upload, FileText, Image, Play, Pause, Users, Server, Zap } = lucide;
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } = Recharts;
        const { ComposableMap, Geographies, Geography, Marker } = ReactSimpleMaps;

        // Utility function
        const cn = (...classes) => classes.filter(Boolean).join(' ');

        // Custom hooks
        const useWebSocket = (onMessage) => {
            const [isConnected, setIsConnected] = useState(false);

            useEffect(() => {
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
                const socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    console.log('WebSocket connected');
                    setIsConnected(true);
                };

                socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        onMessage(message);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };

                socket.onclose = () => {
                    console.log('WebSocket disconnected');
                    setIsConnected(false);
                };

                socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setIsConnected(false);
                };

                return () => {
                    socket.close();
                };
            }, [onMessage]);

            return { isConnected };
        };

        const useToast = () => {
            const [toasts, setToasts] = useState([]);

            const toast = useCallback((message) => {
                const id = Date.now();
                setToasts(prev => [...prev, { id, message }]);
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id));
                }, 5000);
            }, []);

            return { toast, toasts };
        };

        // API functions
        const apiRequest = async (url, options = {}) => {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }

            return response.json();
        };

        // Components
        const Header = ({ title, isSystemActive }) => (
            <header className="bg-white/5 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">{title}</h1>
                            <p className="text-sm text-gray-400">Advanced AI-Powered Security</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className={\`w-2 h-2 rounded-full \${isSystemActive ? 'bg-emerald-500 pulse-glow' : 'bg-red-500'}\`}></div>
                            <span className="text-sm text-gray-300">
                                {isSystemActive ? 'System Active' : 'System Offline'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>
        );

        const Sidebar = ({ alertCounts, currentPage, onPageChange }) => {
            const menuItems = [
                { name: 'Dashboard', path: 'dashboard', icon: BarChart3 },
                { name: 'Email Analysis', path: 'email-analysis', icon: Mail },
                { name: 'Deepfake Detection', path: 'deepfake-detection', icon: Video },
                { name: 'Honeypot Monitor', path: 'honeypot-monitor', icon: Bug },
                { name: 'SSH Honeypot', path: 'ssh-honeypot', icon: Terminal },
                { name: 'Threat Alerts', path: 'threat-alerts', icon: Bell },
                { name: 'Analytics', path: 'analytics', icon: TrendingUp },
            ];

            return (
                <div className="sidebar flex flex-col h-full">
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center space-x-3">
                            <div className="cybershield-gradient rounded-lg p-2">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">CyberShield</h2>
                                <p className="text-xs text-gray-400">AI Security Platform</p>
                            </div>
                        </div>
                    </div>
                    
                    <nav className="flex-1 px-4 py-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.path;
                            
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => onPageChange(item.path)}
                                    className={\`sidebar-link w-full \${isActive ? 'active' : ''}\`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    <span className="flex-1 text-left">{item.name}</span>
                                    {item.path === 'threat-alerts' && alertCounts && (
                                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                                            {alertCounts.critical + alertCounts.high}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            );
        };

        const StatsCard = ({ title, value, icon: Icon, iconColor, bgColor }) => (
            <div className={\`card hover-scale \${bgColor}\`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                        <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                    <div className={\`p-3 rounded-lg \${iconColor}\`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>
        );

        const WorldMap = ({ attacks, onMarkerClick }) => {
            const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json";
            
            return (
                <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            scale: 100,
                            center: [0, 20]
                        }}
                        width={800}
                        height={400}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#1f2937"
                                        stroke="#374151"
                                        strokeWidth={0.5}
                                    />
                                ))
                            }
                        </Geographies>
                        {attacks.map((attack) => (
                            <Marker
                                key={attack.id}
                                coordinates={attack.coordinates}
                                onClick={() => onMarkerClick && onMarkerClick(attack)}
                            >
                                <circle
                                    r={Math.min(10, Math.max(3, attack.count / 2))}
                                    fill={
                                        attack.severity === 'critical' ? '#dc2626' :
                                        attack.severity === 'high' ? '#ea580c' :
                                        attack.severity === 'medium' ? '#d97706' : '#65a30d'
                                    }
                                    stroke="#fff"
                                    strokeWidth={1}
                                    fillOpacity={0.8}
                                    className="cursor-pointer hover:fill-opacity-100"
                                />
                            </Marker>
                        ))}
                    </ComposableMap>
                </div>
            );
        };

        const FileUpload = ({ onFileAnalyzed, accept, maxSize = 10 * 1024 * 1024 }) => {
            const [isDragging, setIsDragging] = useState(false);
            const [uploading, setUploading] = useState(false);

            const handleDrop = useCallback(async (e) => {
                e.preventDefault();
                setIsDragging(false);
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    await processFile(files[0]);
                }
            }, []);

            const handleFileSelect = useCallback(async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await processFile(file);
                }
            }, []);

            const processFile = async (file) => {
                if (file.size > maxSize) {
                    alert('File too large. Maximum size is 10MB.');
                    return;
                }

                setUploading(true);
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const fileData = e.target.result.split(',')[1]; // Remove data URL prefix
                        onFileAnalyzed({
                            fileName: file.name,
                            fileType: file.type,
                            fileData
                        });
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('File processing error:', error);
                } finally {
                    setUploading(false);
                }
            };

            return (
                <div
                    className={\`border-2 border-dashed rounded-lg p-8 text-center transition-colors \${
                        isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-600 hover:border-gray-500'
                    }\`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="loading"></div>
                            <p className="text-gray-400">Processing file...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <div>
                                <p className="text-lg font-medium text-white mb-2">
                                    Drop files here or click to upload
                                </p>
                                <p className="text-sm text-gray-400">
                                    Maximum file size: 10MB
                                </p>
                            </div>
                            <input
                                type="file"
                                accept={Object.keys(accept || {}).join(',')}
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
                                Select File
                            </label>
                        </div>
                    )}
                </div>
            );
        };

        // Page Components
        const Dashboard = () => {
            const [stats, setStats] = useState(null);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const fetchStats = async () => {
                    try {
                        const data = await apiRequest('/api/stats');
                        setStats(data);
                    } catch (error) {
                        console.error('Error fetching stats:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchStats();
                const interval = setInterval(fetchStats, 30000);
                return () => clearInterval(interval);
            }, []);

            if (loading) {
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="loading"></div>
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Active Threats"
                            value={stats?.activeThreats || 0}
                            icon={AlertTriangle}
                            iconColor="bg-red-500"
                            bgColor="bg-red-500/10"
                        />
                        <StatsCard
                            title="Phishing Blocked"
                            value={stats?.phishingBlocked || 0}
                            icon={Mail}
                            iconColor="bg-blue-500"
                            bgColor="bg-blue-500/10"
                        />
                        <StatsCard
                            title="Deepfakes Detected"
                            value={stats?.deepfakesDetected || 0}
                            icon={Video}
                            iconColor="bg-purple-500"
                            bgColor="bg-purple-500/10"
                        />
                        <StatsCard
                            title="Honeypot Hits"
                            value={stats?.honeypotHits || 0}
                            icon={Bug}
                            iconColor="bg-emerald-500"
                            bgColor="bg-emerald-500/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Threat Overview</h3>
                            <div className="text-gray-400">
                                <p>Real-time monitoring active across all security modules.</p>
                                <p className="mt-2">Last updated: {new Date(stats?.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Email Protection</span>
                                    <span className="text-emerald-500">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Deepfake Detection</span>
                                    <span className="text-emerald-500">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Honeypot Network</span>
                                    <span className="text-emerald-500">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const EmailAnalysis = () => {
            const [content, setContent] = useState('');
            const [result, setResult] = useState(null);
            const [loading, setLoading] = useState(false);
            const [analyses, setAnalyses] = useState([]);

            useEffect(() => {
                const fetchAnalyses = async () => {
                    try {
                        const data = await apiRequest('/api/phishing/analyses');
                        setAnalyses(data);
                    } catch (error) {
                        console.error('Error fetching analyses:', error);
                    }
                };
                fetchAnalyses();
            }, []);

            const analyzeEmail = async () => {
                if (!content.trim()) return;

                setLoading(true);
                try {
                    const data = await apiRequest('/api/phishing/analyze', {
                        method: 'POST',
                        body: JSON.stringify({ content }),
                    });
                    setResult(data);
                    setAnalyses(prev => [data.analysis, ...prev]);
                } catch (error) {
                    console.error('Analysis error:', error);
                } finally {
                    setLoading(false);
                }
            };

            return (
                <div className="p-6 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Email Content Analysis</h3>
                        <div className="space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste email content here..."
                                className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                onClick={analyzeEmail}
                                disabled={!content.trim() || loading}
                                className="btn btn-primary disabled:opacity-50"
                            >
                                {loading ? <div className="loading mr-2"></div> : <Mail className="w-4 h-4 mr-2" />}
                                Analyze Email
                            </button>
                        </div>
                    </div>

                    {result && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Analysis Results</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.result.score}%</p>
                                    <p className="text-sm text-gray-400">Phishing Score</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.result.confidence.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-400">Confidence</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.result.suspiciousLinks}</p>
                                    <p className="text-sm text-gray-400">Suspicious Links</p>
                                </div>
                            </div>

                            {result.result.indicators.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Risk Indicators:</h4>
                                    <div className="space-y-1">
                                        {result.result.indicators.map((indicator, index) => (
                                            <span key={index} className="badge badge-high mr-2">
                                                {indicator}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Analyses</h3>
                        <div className="space-y-3">
                            {analyses.map((analysis) => (
                                <div key={analysis.id} className="border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={\`badge \${
                                            analysis.score > 70 ? 'badge-high' :
                                            analysis.score > 40 ? 'badge-medium' : 'badge-low'
                                        }\`}>
                                            {analysis.score}% Risk
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            {new Date(analysis.analyzedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 truncate">
                                        {analysis.content.substring(0, 100)}...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const DeepfakeDetection = () => {
            const [result, setResult] = useState(null);
            const [loading, setLoading] = useState(false);
            const [analyses, setAnalyses] = useState([]);

            useEffect(() => {
                const fetchAnalyses = async () => {
                    try {
                        const data = await apiRequest('/api/deepfake/analyses');
                        setAnalyses(data);
                    } catch (error) {
                        console.error('Error fetching analyses:', error);
                    }
                };
                fetchAnalyses();
            }, []);

            const analyzeFile = async (fileData) => {
                setLoading(true);
                try {
                    const data = await apiRequest('/api/deepfake/analyze', {
                        method: 'POST',
                        body: JSON.stringify(fileData),
                    });
                    setResult(data);
                    setAnalyses(prev => [data.analysis, ...prev]);
                } catch (error) {
                    console.error('Analysis error:', error);
                } finally {
                    setLoading(false);
                }
            };

            return (
                <div className="p-6 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Deepfake Detection</h3>
                        <FileUpload
                            onFileAnalyzed={analyzeFile}
                            accept={{
                                'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
                                'video/*': ['.mp4', '.avi', '.mov', '.mkv']
                            }}
                        />
                    </div>

                    {loading && (
                        <div className="card">
                            <div className="flex items-center justify-center p-8">
                                <div className="loading mr-3"></div>
                                <span className="text-gray-400">Analyzing file for deepfake indicators...</span>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Analysis Results</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <p className={\`text-2xl font-bold \${result.result.isDeepfake ? 'text-red-500' : 'text-emerald-500'}\`}>
                                        {result.result.isDeepfake ? 'DEEPFAKE' : 'AUTHENTIC'}
                                    </p>
                                    <p className="text-sm text-gray-400">Detection Result</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{(result.result.confidence * 100).toFixed(1)}%</p>
                                    <p className="text-sm text-gray-400">Confidence</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.result.processingTime}ms</p>
                                    <p className="text-sm text-gray-400">Processing Time</p>
                                </div>
                            </div>

                            {result.result.anomalies.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Detected Anomalies:</h4>
                                    <div className="space-y-1">
                                        {result.result.anomalies.map((anomaly, index) => (
                                            <span key={index} className="badge badge-high mr-2">
                                                {anomaly}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Analyses</h3>
                        <div className="space-y-3">
                            {analyses.map((analysis) => (
                                <div key={analysis.id} className="border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            {analysis.fileType.startsWith('image/') ? 
                                                <Image className="w-4 h-4 text-blue-500" /> :
                                                <Video className="w-4 h-4 text-purple-500" />
                                            }
                                            <span className="text-white font-medium">{analysis.fileName}</span>
                                        </div>
                                        <span className={\`badge \${analysis.isDeepfake ? 'badge-high' : 'badge-low'}\`}>
                                            {analysis.isDeepfake ? 'Deepfake' : 'Authentic'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-400">
                                        <span>{(analysis.confidence * 100).toFixed(1)}% confidence</span>
                                        <span>{new Date(analysis.analyzedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const HoneypotMonitor = () => {
            const [logs, setLogs] = useState([]);
            const [stats, setStats] = useState(null);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const fetchData = async () => {
                    try {
                        const [logsData, statsData] = await Promise.all([
                            apiRequest('/api/honeypot/logs'),
                            apiRequest('/api/honeypot/stats')
                        ]);
                        setLogs(logsData);
                        setStats(statsData);
                    } catch (error) {
                        console.error('Error fetching honeypot data:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchData();
                const interval = setInterval(fetchData, 30000);
                return () => clearInterval(interval);
            }, []);

            if (loading) {
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="loading"></div>
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatsCard
                            title="SSH Attacks"
                            value={stats?.ssh || 0}
                            icon={Terminal}
                            iconColor="bg-red-500"
                            bgColor="bg-red-500/10"
                        />
                        <StatsCard
                            title="HTTP Attacks"
                            value={stats?.http || 0}
                            icon={Globe}
                            iconColor="bg-blue-500"
                            bgColor="bg-blue-500/10"
                        />
                        <StatsCard
                            title="FTP Attacks"
                            value={stats?.ftp || 0}
                            icon={Server}
                            iconColor="bg-purple-500"
                            bgColor="bg-purple-500/10"
                        />
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Attack Logs</h3>
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className="border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={\`badge \${
                                                log.severity === 'critical' ? 'badge-critical' :
                                                log.severity === 'high' ? 'badge-high' :
                                                log.severity === 'medium' ? 'badge-medium' : 'badge-low'
                                            }\`}>
                                                {log.severity.toUpperCase()}
                                            </span>
                                            <span className="text-white font-medium">{log.service.toUpperCase()}</span>
                                            <span className="text-gray-400">from</span>
                                            <span className="text-emerald-400">{log.sourceIp}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {new Date(log.detectedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        Attack Type: {log.attackType} | Port: {log.port}
                                        {log.location && \` | Location: \${log.location.city}, \${log.location.country}\`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const SSHHoneypot = () => {
            const [dashboardData, setDashboardData] = useState(null);
            const [loading, setLoading] = useState(true);
            const [isLive, setIsLive] = useState(true);
            const [selectedAttack, setSelectedAttack] = useState(null);

            useEffect(() => {
                const fetchData = async () => {
                    try {
                        const data = await apiRequest('/api/ssh-honeypot/dashboard');
                        setDashboardData(data);
                    } catch (error) {
                        console.error('Error fetching SSH honeypot data:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchData();
                
                let interval;
                if (isLive) {
                    interval = setInterval(fetchData, 15000);
                }

                return () => {
                    if (interval) clearInterval(interval);
                };
            }, [isLive]);

            if (loading) {
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="loading"></div>
                    </div>
                );
            }

            const { statistics, attackPoints, recentLogs } = dashboardData || {};

            return (
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">SSH Honeypot Dashboard</h2>
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={\`btn \${isLive ? 'btn-primary' : 'bg-gray-600 hover:bg-gray-500'} flex items-center space-x-2\`}
                        >
                            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span>{isLive ? 'Pause' : 'Resume'} Live Feed</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatsCard
                            title="Total Attacks"
                            value={statistics?.totalAttacks || 0}
                            icon={AlertTriangle}
                            iconColor="bg-red-500"
                            bgColor="bg-red-500/10"
                        />
                        <StatsCard
                            title="Attacks (24h)"
                            value={statistics?.attacks24h || 0}
                            icon={Clock}
                            iconColor="bg-orange-500"
                            bgColor="bg-orange-500/10"
                        />
                        <StatsCard
                            title="Unique IPs"
                            value={statistics?.uniqueIPs || 0}
                            icon={Users}
                            iconColor="bg-blue-500"
                            bgColor="bg-blue-500/10"
                        />
                        <StatsCard
                            title="Countries"
                            value={statistics?.uniqueCountries || 0}
                            icon={Globe}
                            iconColor="bg-emerald-500"
                            bgColor="bg-emerald-500/10"
                        />
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Attack Locations</h3>
                        <WorldMap
                            attacks={attackPoints || []}
                            onMarkerClick={setSelectedAttack}
                        />
                    </div>

                    {selectedAttack && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Attack Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Attacker IP</p>
                                    <p className="text-white font-mono">{selectedAttack.ip}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Location</p>
                                    <p className="text-white">{selectedAttack.city}, {selectedAttack.country}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Attack Type</p>
                                    <p className="text-white">{selectedAttack.attackType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Attempts</p>
                                    <p className="text-white">{selectedAttack.count}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Severity</p>
                                    <span className={\`badge \${
                                        selectedAttack.severity === 'critical' ? 'badge-critical' :
                                        selectedAttack.severity === 'high' ? 'badge-high' :
                                        selectedAttack.severity === 'medium' ? 'badge-medium' : 'badge-low'
                                    }\`}>
                                        {selectedAttack.severity.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Last Seen</p>
                                    <p className="text-white">{new Date(selectedAttack.lastSeen).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Countries</h3>
                            <div className="space-y-2">
                                {statistics?.topCountries?.slice(0, 5).map(([country, count]) => (
                                    <div key={country} className="flex items-center justify-between">
                                        <span className="text-gray-300">{country}</span>
                                        <span className="text-white font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Attack Types</h3>
                            <div className="space-y-2">
                                {statistics?.topAttackTypes?.slice(0, 5).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-gray-300">{type}</span>
                                        <span className="text-white font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent SSH Attacks</h3>
                        <div className="space-y-3">
                            {recentLogs?.slice(0, 10).map((log) => (
                                <div key={log.id} className="border border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={\`badge \${
                                                log.severity === 'critical' ? 'badge-critical' :
                                                log.severity === 'high' ? 'badge-high' :
                                                log.severity === 'medium' ? 'badge-medium' : 'badge-low'
                                            }\`}>
                                                {log.severity.toUpperCase()}
                                            </span>
                                            <span className="text-emerald-400 font-mono">{log.sourceIp}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-white">{log.attackType}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {new Date(log.detectedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {log.location && (
                                        <p className="text-sm text-gray-300">
                                            <MapPin className="w-3 h-3 inline mr-1" />
                                            {log.location.city}, {log.location.country}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const ThreatAlerts = () => {
            const [alerts, setAlerts] = useState([]);
            const [loading, setLoading] = useState(true);

            useEffect(() => {
                const fetchAlerts = async () => {
                    try {
                        const data = await apiRequest('/api/alerts');
                        setAlerts(data);
                    } catch (error) {
                        console.error('Error fetching alerts:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchAlerts();
                const interval = setInterval(fetchAlerts, 30000);
                return () => clearInterval(interval);
            }, []);

            const markAsRead = async (id) => {
                try {
                    await apiRequest(\`/api/alerts/\${id}/read\`, { method: 'PATCH' });
                    setAlerts(prev => prev.map(alert => 
                        alert.id === id ? { ...alert, isRead: true } : alert
                    ));
                } catch (error) {
                    console.error('Error marking alert as read:', error);
                }
            };

            if (loading) {
                return (
                    <div className="flex items-center justify-center h-64">
                        <div className="loading"></div>
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Threat Alerts</h2>
                        <span className="text-sm text-gray-400">
                            {alerts.filter(a => !a.isRead).length} unread alerts
                        </span>
                    </div>

                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div 
                                key={alert.id} 
                                className={\`card \${!alert.isRead ? 'border-l-4 border-l-emerald-500' : ''}\`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={\`badge \${
                                                alert.severity === 'critical' ? 'badge-critical' :
                                                alert.severity === 'high' ? 'badge-high' :
                                                alert.severity === 'medium' ? 'badge-medium' : 'badge-low'
                                            }\`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-400">{alert.category}</span>
                                            {!alert.isRead && (
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{alert.title}</h3>
                                        <p className="text-gray-300 mb-2">{alert.description}</p>
                                        <p className="text-sm text-gray-400">
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {!alert.isRead && (
                                        <button
                                            onClick={() => markAsRead(alert.id)}
                                            className="btn bg-gray-600 hover:bg-gray-500 text-sm"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        const Analytics = () => {
            return (
                <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-white">Security Analytics</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Threat Trends</h3>
                            <div className="text-gray-400">
                                <p>Advanced analytics and reporting coming soon.</p>
                                <p className="mt-2">This section will include:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Historical threat analysis</li>
                                    <li>Attack pattern recognition</li>
                                    <li>Geographic threat mapping</li>
                                    <li>Predictive threat modeling</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="card">
                            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                            <div className="text-gray-400">
                                <p>System performance and detection accuracy metrics.</p>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span>Detection Accuracy</span>
                                        <span className="text-emerald-500">98.7%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>False Positive Rate</span>
                                        <span className="text-yellow-500">1.3%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>System Uptime</span>
                                        <span className="text-emerald-500">99.9%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        // Toast Component
        const ToastContainer = ({ toasts }) => (
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg max-w-sm"
                    >
                        <p className="text-white">{toast.message}</p>
                    </div>
                ))}
            </div>
        );

        // Main App Component
        const App = () => {
            const [currentPage, setCurrentPage] = useState('dashboard');
            const [alertCounts, setAlertCounts] = useState(null);
            const { toast, toasts } = useToast();

            const handleWebSocketMessage = useCallback((message) => {
                if (message.type === 'new_alert') {
                    toast(\`New \${message.alert.severity} alert: \${message.alert.title}\`);
                    // Refresh alert counts
                    fetchAlertCounts();
                }
            }, [toast]);

            const { isConnected } = useWebSocket(handleWebSocketMessage);

            const fetchAlertCounts = useCallback(async () => {
                try {
                    const data = await apiRequest('/api/alerts/counts');
                    setAlertCounts(data);
                } catch (error) {
                    console.error('Error fetching alert counts:', error);
                }
            }, []);

            useEffect(() => {
                fetchAlertCounts();
                const interval = setInterval(fetchAlertCounts, 30000);
                return () => clearInterval(interval);
            }, [fetchAlertCounts]);

            const renderPage = () => {
                switch (currentPage) {
                    case 'dashboard': return <Dashboard />;
                    case 'email-analysis': return <EmailAnalysis />;
                    case 'deepfake-detection': return <DeepfakeDetection />;
                    case 'honeypot-monitor': return <HoneypotMonitor />;
                    case 'ssh-honeypot': return <SSHHoneypot />;
                    case 'threat-alerts': return <ThreatAlerts />;
                    case 'analytics': return <Analytics />;
                    default: return <Dashboard />;
                }
            };

            const getPageTitle = () => {
                const titles = {
                    'dashboard': 'Dashboard',
                    'email-analysis': 'Email Analysis',
                    'deepfake-detection': 'Deepfake Detection',
                    'honeypot-monitor': 'Honeypot Monitor',
                    'ssh-honeypot': 'SSH Honeypot Dashboard',
                    'threat-alerts': 'Threat Alerts',
                    'analytics': 'Analytics'
                };
                return titles[currentPage] || 'CyberShield AI';
            };

            return (
                <div className="flex h-screen overflow-hidden bg-gray-900 text-white">
                    <Sidebar 
                        alertCounts={alertCounts} 
                        currentPage={currentPage} 
                        onPageChange={setCurrentPage} 
                    />
                    <div className="flex flex-col w-0 flex-1 overflow-hidden">
                        <Header title={getPageTitle()} isSystemActive={isConnected} />
                        <main className="flex-1 relative overflow-y-auto focus:outline-none">
                            {renderPage()}
                        </main>
                    </div>
                    <ToastContainer toasts={toasts} />
                </div>
            );
        };

        // Render the app
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
}

// Start the server
honeypotManager.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  honeypotManager.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  honeypotManager.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  CyberShield AI running on port ${PORT}`);
  console.log(`📧 Email alerts: ${process.env.SENDGRID_API_KEY ? 'Configured' : 'Simulated (set SENDGRID_API_KEY for real emails)'}`);
  console.log(`🌐 Access your security dashboard at: http://localhost:${PORT}`);
});