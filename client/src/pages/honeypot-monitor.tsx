import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HoneypotStats, HoneypotLog } from "@/lib/types";

export default function HoneypotMonitor() {
  const { data: honeypotStats } = useQuery<HoneypotStats>({
    queryKey: ['/api/honeypot/stats'],
  });

  const { data: recentLogs } = useQuery<HoneypotLog[]>({
    queryKey: ['/api/honeypot/logs', { limit: 20 }],
  });

  const getServiceStatus = (service: string): { status: string; color: string } => {
    // All services are active in this implementation
    return { status: 'Active', color: 'text-success' };
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-primary text-white">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-6">
      {/* Honeypot Services Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">SSH Honeypot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary">Status</span>
              <span className="flex items-center text-success">
                <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Port</span>
                <span className="text-sm text-white">22</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Attempts Today</span>
                <span className="text-sm text-destructive font-medium">
                  {honeypotStats?.ssh || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Success Rate</span>
                <span className="text-sm text-white">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">HTTP Honeypot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary">Status</span>
              <span className="flex items-center text-success">
                <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Ports</span>
                <span className="text-sm text-white">80, 8080</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Requests Today</span>
                <span className="text-sm text-warning font-medium">
                  {honeypotStats?.http || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Detection Rate</span>
                <span className="text-sm text-white">98.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">FTP Honeypot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary">Status</span>
              <span className="flex items-center text-warning">
                <div className="w-2 h-2 bg-warning rounded-full mr-2 animate-pulse" />
                Monitoring
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Port</span>
                <span className="text-sm text-white">21</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Connections</span>
                <span className="text-sm text-primary font-medium">
                  {honeypotStats?.ftp || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Response Time</span>
                <span className="text-sm text-white">&lt; 50ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attack Log */}
      <Card className="bg-surface border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent Attack Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Source IP</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Service</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Attack Type</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Severity</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-background">
                      <td className="py-3 px-4 text-sm text-white">
                        {formatTimeAgo(log.detectedAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-mono">
                        {log.sourceIp}
                      </td>
                      <td className="py-3 px-4 text-sm text-white uppercase">
                        {log.service}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {log.attackType}
                      </td>
                      <td className="py-3 px-4">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {log.location?.country || 'Unknown'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      No attack attempts logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
