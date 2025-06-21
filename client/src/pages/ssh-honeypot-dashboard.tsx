import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorldMap, type AttackPoint } from "@/components/world-map";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Globe, Shield, Clock, MapPin, Activity } from "lucide-react";
import type { HoneypotLog } from "@/lib/types";

interface SSHStatistics {
  totalAttacks: number;
  attacks24h: number;
  attacks7d: number;
  uniqueIPs: number;
  uniqueCountries: number;
  topCountries: Array<{ country: string; count: number }>;
  topAttackTypes: Array<{ type: string; count: number }>;
}

export default function SSHHoneypotDashboard() {
  const [selectedAttack, setSelectedAttack] = useState<AttackPoint | null>(null);
  const [isLiveView, setIsLiveView] = useState(true);

  const { data: sshAttacks, refetch: refetchAttacks } = useQuery<HoneypotLog[]>({
    queryKey: ['/api/honeypot/ssh/attacks'],
    refetchInterval: isLiveView ? 5000 : false,
  });

  const { data: mapData, refetch: refetchMapData } = useQuery<AttackPoint[]>({
    queryKey: ['/api/honeypot/ssh/map-data'],
    refetchInterval: isLiveView ? 10000 : false,
  });

  const { data: statistics, refetch: refetchStats } = useQuery<SSHStatistics>({
    queryKey: ['/api/honeypot/ssh/statistics'],
    refetchInterval: isLiveView ? 30000 : false,
  });

  useEffect(() => {
    if (isLiveView) {
      const interval = setInterval(() => {
        refetchAttacks();
        refetchMapData();
        refetchStats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLiveView, refetchAttacks, refetchMapData, refetchStats]);

  const handleMarkerClick = (attack: AttackPoint) => {
    setSelectedAttack(attack);
  };

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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white">SSH Honeypot Dashboard</h2>
          <p className="text-text-secondary">Real-time monitoring of SSH attack attempts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isLiveView ? 'bg-success' : 'bg-gray-500'}`} />
            <span className="text-sm text-text-secondary">
              {isLiveView ? 'Live View' : 'Paused'}
            </span>
          </div>
          <Button
            variant={isLiveView ? "secondary" : "default"}
            onClick={() => setIsLiveView(!isLiveView)}
            className="bg-primary hover:bg-primary/90"
          >
            {isLiveView ? 'Pause' : 'Resume'} Live View
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center mr-4">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Attacks</p>
                <p className="text-2xl font-bold text-white">{statistics?.totalAttacks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-warning rounded-lg flex items-center justify-center mr-4">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Last 24 Hours</p>
                <p className="text-2xl font-bold text-white">{statistics?.attacks24h || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-4">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Unique IPs</p>
                <p className="text-2xl font-bold text-white">{statistics?.uniqueIPs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center mr-4">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary">Countries</p>
                <p className="text-2xl font-bold text-white">{statistics?.uniqueCountries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* World Map and Attack Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World Map */}
        <Card className="lg:col-span-2 bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Global Attack Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-background rounded-lg">
              {mapData ? (
                <WorldMap
                  attacks={mapData}
                  onMarkerClick={handleMarkerClick}
                  className="rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  <Activity className="mr-2 h-6 w-6 animate-spin" />
                  Loading attack data...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attack Details */}
        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              {selectedAttack ? 'Attack Details' : 'Recent Attacks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAttack ? (
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{selectedAttack.city}, {selectedAttack.country}</h4>
                    {getSeverityBadge(selectedAttack.severity)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">IP Address:</span>
                      <span className="text-white font-mono">{selectedAttack.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Attack Type:</span>
                      <span className="text-white">{selectedAttack.attackType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total Attempts:</span>
                      <span className="text-white font-bold">{selectedAttack.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">First Seen:</span>
                      <span className="text-white">{formatTimeAgo(selectedAttack.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Seen:</span>
                      <span className="text-white">{formatTimeAgo(selectedAttack.lastSeen)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedAttack(null)}
                  className="w-full bg-gray-700 hover:bg-gray-600"
                >
                  View All Attacks
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sshAttacks && sshAttacks.slice(0, 10).map((attack) => (
                  <div key={attack.id} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium font-mono text-sm">{attack.sourceIp}</span>
                      {getSeverityBadge(attack.severity)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      <div>{attack.location?.city}, {attack.location?.country}</div>
                      <div>{attack.attackType} • {formatTimeAgo(attack.detectedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Countries and Attack Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Top Attack Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics?.topCountries?.slice(0, 8).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-text-secondary w-6">#{index + 1}</span>
                    <span className="text-white font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24">
                      <Progress 
                        value={(country.count / (statistics?.topCountries?.[0]?.count || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm text-white font-mono w-12 text-right">{country.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Attack Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics?.topAttackTypes?.map((attackType, index) => (
                <div key={attackType.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-text-secondary w-6">#{index + 1}</span>
                    <span className="text-white font-medium">{attackType.type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24">
                      <Progress 
                        value={(attackType.count / (statistics?.topAttackTypes?.[0]?.count || 1)) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <span className="text-sm text-white font-mono w-12 text-right">{attackType.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Attack Feed */}
      <Card className="bg-surface border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Live Attack Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Source IP</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Attack Type</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Severity</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-medium">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {sshAttacks && sshAttacks.slice(0, 20).map((attack) => (
                  <tr key={attack.id} className="border-b border-gray-800 hover:bg-background">
                    <td className="py-3 px-4 text-sm text-white">
                      {formatTimeAgo(attack.detectedAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-mono">
                      {attack.sourceIp}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {attack.location?.city}, {attack.location?.country}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {attack.attackType}
                    </td>
                    <td className="py-3 px-4">
                      {getSeverityBadge(attack.severity)}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {attack.payload?.match(/\d+/)?.[0] || '1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}