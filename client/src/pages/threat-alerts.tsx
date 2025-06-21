import { useMutation, useQuery } from "@tanstack/react-query";
import { Filter, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Alert, AlertCounts } from "@/lib/types";

export default function ThreatAlerts() {
  const { toast } = useToast();

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ['/api/alerts', { limit: 50 }],
  });

  const { data: alertCounts } = useQuery<AlertCounts>({
    queryKey: ['/api/alerts/counts'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark alert as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/counts'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/alerts/read-all', {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all alerts as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/counts'] });
      toast({
        title: "All alerts marked as read",
        description: "All alerts have been marked as read successfully",
      });
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">CRITICAL</Badge>;
      case 'high':
        return <Badge variant="destructive">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-white">MEDIUM</Badge>;
      case 'low':
        return <Badge className="bg-primary text-white">LOW</Badge>;
      default:
        return <Badge variant="secondary">{severity.toUpperCase()}</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    const baseClasses = "w-8 h-8 rounded-lg flex items-center justify-center";
    switch (severity) {
      case 'critical':
        return <div className={`${baseClasses} bg-destructive`}>⚠️</div>;
      case 'high':
        return <div className={`${baseClasses} bg-destructive`}>🚨</div>;
      case 'medium':
        return <div className={`${baseClasses} bg-warning`}>⚡</div>;
      case 'low':
        return <div className={`${baseClasses} bg-primary`}>ℹ️</div>;
      default:
        return <div className={`${baseClasses} bg-gray-500`}>•</div>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'email': return '📧';
      case 'media': return '🎥';
      case 'honeypot': return '🕷️';
      case 'system': return '⚙️';
      default: return '🔒';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Threat Alerts</h2>
        <div className="flex space-x-2">
          <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Alert Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-destructive/20 border-destructive">
          <CardContent className="p-4 text-center">
            <div className="text-destructive text-2xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-white">
              {alertCounts?.critical || 0}
            </div>
            <p className="text-sm text-text-secondary">Critical</p>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/20 border-warning">
          <CardContent className="p-4 text-center">
            <div className="text-warning text-2xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-white">
              {alertCounts?.high || 0}
            </div>
            <p className="text-sm text-text-secondary">High</p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/20 border-primary">
          <CardContent className="p-4 text-center">
            <div className="text-primary text-2xl mb-2">ℹ️</div>
            <div className="text-2xl font-bold text-white">
              {alertCounts?.medium || 0}
            </div>
            <p className="text-sm text-text-secondary">Medium</p>
          </CardContent>
        </Card>
        
        <Card className="bg-success/20 border-success">
          <CardContent className="p-4 text-center">
            <div className="text-success text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold text-white">
              {alertCounts?.low || 0}
            </div>
            <p className="text-sm text-text-secondary">Low</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-surface border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-700">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-6 hover:bg-background transition-colors ${
                    alert.isRead ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium">{alert.title}</h4>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(alert.severity)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(alert.id)}
                            disabled={alert.isRead || markAsReadMutation.isPending}
                            className="p-1"
                          >
                            {alert.isRead ? (
                              <EyeOff className="h-4 w-4 text-text-secondary" />
                            ) : (
                              <Eye className="h-4 w-4 text-text-secondary" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm mt-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-text-secondary">
                        <span className="flex items-center">
                          ⏰ {formatTimeAgo(alert.createdAt)}
                        </span>
                        <span className="flex items-center">
                          {getCategoryIcon(alert.category)} {alert.category}
                        </span>
                        <span className="flex items-center">
                          {alert.isRead ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                          {alert.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary">
                <p>No alerts at this time</p>
                <p className="text-sm mt-2">Your system is secure and monitoring</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
