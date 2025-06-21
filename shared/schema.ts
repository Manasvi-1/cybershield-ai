import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const threats = pgTable("threats", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'phishing', 'deepfake', 'honeypot'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  source: text("source").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("active"), // 'active', 'resolved', 'dismissed'
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
});

export const phishingAnalysis = pgTable("phishing_analysis", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  score: real("score").notNull(), // 0-100 phishing probability
  confidence: real("confidence").notNull(), // AI confidence level
  suspiciousLinks: integer("suspicious_links").notNull().default(0),
  indicators: jsonb("indicators"), // Array of risk indicators
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const deepfakeAnalysis = pgTable("deepfake_analysis", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  isDeepfake: boolean("is_deepfake").notNull(),
  confidence: real("confidence").notNull(),
  processingTime: real("processing_time").notNull(),
  anomalies: jsonb("anomalies"), // Array of detected anomalies
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const honeypotLogs = pgTable("honeypot_logs", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(), // 'ssh', 'http', 'ftp'
  sourceIp: text("source_ip").notNull(),
  attackType: text("attack_type").notNull(),
  severity: text("severity").notNull(),
  port: integer("port").notNull(),
  payload: text("payload"),
  location: jsonb("location"), // GeoIP data
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  category: text("category").notNull(), // 'email', 'media', 'honeypot', 'system'
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  activeThreats: integer("active_threats").notNull().default(0),
  phishingBlocked: integer("phishing_blocked").notNull().default(0),
  deepfakesDetected: integer("deepfakes_detected").notNull().default(0),
  honeypotHits: integer("honeypot_hits").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertThreatSchema = createInsertSchema(threats).omit({ id: true, detectedAt: true });
export const insertPhishingAnalysisSchema = createInsertSchema(phishingAnalysis).omit({ id: true, analyzedAt: true });
export const insertDeepfakeAnalysisSchema = createInsertSchema(deepfakeAnalysis).omit({ id: true, analyzedAt: true });
export const insertHoneypotLogSchema = createInsertSchema(honeypotLogs).omit({ id: true, detectedAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({ id: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Threat = typeof threats.$inferSelect;
export type InsertThreat = z.infer<typeof insertThreatSchema>;
export type PhishingAnalysis = typeof phishingAnalysis.$inferSelect;
export type InsertPhishingAnalysis = z.infer<typeof insertPhishingAnalysisSchema>;
export type DeepfakeAnalysis = typeof deepfakeAnalysis.$inferSelect;
export type InsertDeepfakeAnalysis = z.infer<typeof insertDeepfakeAnalysisSchema>;
export type HoneypotLog = typeof honeypotLogs.$inferSelect;
export type InsertHoneypotLog = z.infer<typeof insertHoneypotLogSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
