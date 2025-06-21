import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { PhishingDetector } from "./ml/phishing-detector";
import { DeepfakeDetector } from "./ml/deepfake-detector";
import { honeypotManager } from "./honeypot/services";
import { insertPhishingAnalysisSchema, insertDeepfakeAnalysisSchema, insertAlertSchema, insertThreatSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const phishingDetector = new PhishingDetector();
const deepfakeDetector = new DeepfakeDetector();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected WebSocket clients
  const wsClients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      wsClients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // System Stats API
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch system stats' });
    }
  });

  // Phishing Analysis API
  app.post('/api/analyze/email', async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Email content is required' });
      }

      const result = await phishingDetector.analyzeEmail(content);
      
      // Store analysis in database
      const analysis = await storage.createPhishingAnalysis({
        content,
        score: result.score,
        confidence: result.confidence,
        suspiciousLinks: result.suspiciousLinks,
        indicators: result.indicators,
      });

      // Create threat and alert if high risk
      if (result.score >= 70) {
        const threat = await storage.createThreat({
          type: 'phishing',
          severity: result.score >= 90 ? 'critical' : 'high',
          source: 'email_analysis',
          description: `High-risk phishing email detected with ${result.score}% confidence`,
          metadata: { analysisId: analysis.id, indicators: result.indicators },
          status: 'active'
        });

        const alert = await storage.createAlert({
          title: 'High-Risk Phishing Email Detected',
          description: `Suspicious email content with ${result.score}% phishing probability`,
          severity: threat.severity,
          category: 'email',
          isRead: false,
          metadata: { threatId: threat.id, analysisId: analysis.id }
        });

        // Broadcast alert via WebSocket
        broadcast({ type: 'new_alert', alert, threat });

        // Update system stats
        const stats = await storage.getSystemStats();
        if (stats) {
          await storage.updateSystemStats({
            phishingBlocked: stats.phishingBlocked + 1,
            activeThreats: stats.activeThreats + 1
          });
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Email analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze email' });
    }
  });

  // Deepfake Analysis API
  app.post('/api/analyze/deepfake', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const { originalname, mimetype, size, buffer } = req.file;
      
      let result;
      if (mimetype.startsWith('image/')) {
        result = await deepfakeDetector.analyzeImage(buffer, originalname);
      } else if (mimetype.startsWith('video/')) {
        result = await deepfakeDetector.analyzeVideo(buffer, originalname);
      } else {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Store analysis in database
      const analysis = await storage.createDeepfakeAnalysis({
        fileName: originalname,
        fileType: mimetype,
        fileSize: size,
        isDeepfake: result.isDeepfake,
        confidence: result.confidence,
        processingTime: result.processingTime,
        anomalies: result.anomalies,
      });

      // Create threat and alert if deepfake detected
      if (result.isDeepfake && result.confidence >= 80) {
        const threat = await storage.createThreat({
          type: 'deepfake',
          severity: result.confidence >= 95 ? 'critical' : 'high',
          source: 'media_analysis',
          description: `Deepfake content detected with ${result.confidence}% confidence`,
          metadata: { analysisId: analysis.id, anomalies: result.anomalies },
          status: 'active'
        });

        const alert = await storage.createAlert({
          title: 'Deepfake Content Detected',
          description: `AI-generated media detected with ${result.confidence}% confidence level`,
          severity: threat.severity,
          category: 'media',
          isRead: false,
          metadata: { threatId: threat.id, analysisId: analysis.id }
        });

        // Broadcast alert via WebSocket
        broadcast({ type: 'new_alert', alert, threat });

        // Update system stats
        const stats = await storage.getSystemStats();
        if (stats) {
          await storage.updateSystemStats({
            deepfakesDetected: stats.deepfakesDetected + 1,
            activeThreats: stats.activeThreats + 1
          });
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Deepfake analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze file' });
    }
  });

  // Threats API
  app.get('/api/threats', async (req, res) => {
    try {
      const { limit, offset, type } = req.query;
      const threats = type 
        ? await storage.getThreatsByType(type as string)
        : await storage.getThreats(
            limit ? parseInt(limit as string) : undefined,
            offset ? parseInt(offset as string) : undefined
          );
      res.json(threats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch threats' });
    }
  });

  // Honeypot Logs API
  app.get('/api/honeypot/logs', async (req, res) => {
    try {
      const { limit, service } = req.query;
      const logs = await storage.getHoneypotLogs(
        limit ? parseInt(limit as string) : undefined,
        service as string
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch honeypot logs' });
    }
  });

  app.get('/api/honeypot/stats', async (req, res) => {
    try {
      const stats = await storage.getHoneypotStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch honeypot stats' });
    }
  });

  // SSH Honeypot Dashboard API
  app.get('/api/honeypot/ssh/attacks', async (req, res) => {
    try {
      const sshLogs = await storage.getHoneypotLogs(500, 'ssh');
      res.json(sshLogs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch SSH attack logs' });
    }
  });

  app.get('/api/honeypot/ssh/map-data', async (req, res) => {
    try {
      const sshLogs = await storage.getHoneypotLogs(1000, 'ssh');
      
      // Group attacks by location
      const attackMap = new Map();
      
      sshLogs.forEach(log => {
        if (log.location && typeof log.location === 'object' && 
            'lat' in log.location && 'lon' in log.location &&
            log.location.lat && log.location.lon) {
          const location = log.location as any;
          const key = `${location.lat},${location.lon}`;
          
          if (attackMap.has(key)) {
            const existing = attackMap.get(key);
            existing.count += 1;
            existing.lastSeen = new Date(Math.max(existing.lastSeen.getTime(), log.detectedAt.getTime()));
          } else {
            attackMap.set(key, {
              id: `attack-${key}`,
              coordinates: [location.lon, location.lat],
              country: location.country || 'Unknown',
              city: location.city || 'Unknown',
              ip: log.sourceIp,
              attackType: log.attackType,
              severity: log.severity,
              timestamp: log.detectedAt,
              lastSeen: log.detectedAt,
              count: 1
            });
          }
        }
      });

      const attackPoints = Array.from(attackMap.values());
      res.json(attackPoints);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch map data' });
    }
  });

  app.get('/api/honeypot/ssh/statistics', async (req, res) => {
    try {
      const sshLogs = await storage.getHoneypotLogs(1000, 'ssh');
      
      // Calculate statistics
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const attacks24h = sshLogs.filter(log => log.detectedAt >= last24h).length;
      const attacks7d = sshLogs.filter(log => log.detectedAt >= last7d).length;
      
      const uniqueIPs = new Set(sshLogs.map(log => log.sourceIp)).size;
      const uniqueCountries = new Set(
        sshLogs.map(log => (log.location as any)?.country).filter(Boolean)
      ).size;
      
      const topCountries = sshLogs
        .reduce((acc, log) => {
          const country = (log.location as any)?.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const topAttackTypes = sshLogs
        .reduce((acc, log) => {
          acc[log.attackType] = (acc[log.attackType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      res.json({
        totalAttacks: sshLogs.length,
        attacks24h,
        attacks7d,
        uniqueIPs,
        uniqueCountries,
        topCountries: Object.entries(topCountries)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([country, count]) => ({ country, count })),
        topAttackTypes: Object.entries(topAttackTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch SSH statistics' });
    }
  });

  // Alerts API
  app.get('/api/alerts', async (req, res) => {
    try {
      const { limit, unreadOnly } = req.query;
      const alerts = await storage.getAlerts(
        limit ? parseInt(limit as string) : undefined,
        unreadOnly === 'true'
      );
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  app.get('/api/alerts/counts', async (req, res) => {
    try {
      const counts = await storage.getAlertCounts();
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alert counts' });
    }
  });

  app.patch('/api/alerts/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark alert as read' });
    }
  });

  app.patch('/api/alerts/read-all', async (req, res) => {
    try {
      await storage.markAllAlertsAsRead();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark all alerts as read' });
    }
  });

  // Analysis History APIs
  app.get('/api/analysis/phishing', async (req, res) => {
    try {
      const { limit } = req.query;
      const analyses = await storage.getPhishingAnalyses(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch phishing analyses' });
    }
  });

  app.get('/api/analysis/deepfake', async (req, res) => {
    try {
      const { limit } = req.query;
      const analyses = await storage.getDeepfakeAnalyses(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch deepfake analyses' });
    }
  });

  // Start honeypot services
  honeypotManager.start();

  // Listen for honeypot attacks and broadcast them
  honeypotManager.on('attack', async (attack) => {
    // Create alert for high severity attacks
    if (attack.severity === 'high' || attack.severity === 'critical') {
      const alert = await storage.createAlert({
        title: `${attack.service.toUpperCase()} Honeypot Attack`,
        description: `${attack.attackType} from IP ${attack.sourceIp}`,
        severity: attack.severity,
        category: 'honeypot',
        isRead: false,
        metadata: { attack }
      });

      broadcast({ type: 'honeypot_attack', attack, alert });
    } else {
      broadcast({ type: 'honeypot_attack', attack });
    }
  });

  // Broadcast system stats updates every 30 seconds
  setInterval(async () => {
    try {
      const stats = await storage.getSystemStats();
      if (stats) {
        broadcast({ type: 'stats_update', stats });
      }
    } catch (error) {
      console.error('Failed to broadcast stats update:', error);
    }
  }, 30000);

  return httpServer;
}
