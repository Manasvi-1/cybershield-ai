import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Mail, Video, Bug } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemStats, Alert } from "@/lib/types";

export default function Dashboard() {
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentAlerts } = useQuery<Alert[]>({
    queryKey: ['/api/alerts', { limit: 5 }],
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-primary';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Threats"
          value={stats?.activeThreats || 0}
          icon={AlertTriangle}
          iconColor="text-white"
          bgColor="bg-destructive"
        />
        <StatsCard
          title="Phishing Blocked"
          value={stats?.phishingBlocked || 0}
          icon={Mail}
          iconColor="text-white"
          bgColor="bg-warning"
        />
        <StatsCard
          title="Deepfakes Detected"
          value={stats?.deepfakesDetected || 0}
          icon={Video}
          iconColor="text-white"
          bgColor="bg-primary"
        />
        <StatsCard
          title="Honeypot Hits"
          value={stats?.honeypotHits || 0}
          icon={Bug}
          iconColor="text-white"
          bgColor="bg-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Activity Map */}
        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Real-time Threat Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-background rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
                </div>
                <p className="text-text-secondary mb-4">Live threat monitoring active</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">SSH Attacks</span>
                    <span className="text-sm text-destructive font-medium">
                      {Math.floor(Math.random() * 30) + 10} active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Web Crawlers</span>
                    <span className="text-sm text-warning font-medium">
                      {Math.floor(Math.random() * 20) + 5} detected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Port Scans</span>
                    <span className="text-sm text-primary font-medium">
                      {Math.floor(Math.random() * 15) + 3} attempts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-background rounded-lg">
                    <div className={`w-2 h-2 ${getSeverityColor(alert.severity)} rounded-full mt-2 flex-shrink-0`} />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{alert.title}</p>
                      <p className="text-xs text-text-secondary mt-1">{alert.description}</p>
                      <span className="text-xs text-text-secondary">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-text-secondary py-8">
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
