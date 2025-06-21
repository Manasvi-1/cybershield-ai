import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import Dashboard from "@/pages/dashboard";
import EmailAnalysis from "@/pages/email-analysis";
import DeepfakeDetection from "@/pages/deepfake-detection";
import HoneypotMonitor from "@/pages/honeypot-monitor";
import SSHHoneypotDashboard from "@/pages/ssh-honeypot-dashboard";
import ThreatAlerts from "@/pages/threat-alerts";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import type { AlertCounts, WebSocketMessage } from "@/lib/types";

function AppContent() {
  const { toast } = useToast();

  const { data: alertCounts } = useQuery<AlertCounts>({
    queryKey: ['/api/alerts/counts'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle WebSocket messages for real-time updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_alert':
        if (message.alert) {
          toast({
            title: message.alert.title,
            description: message.alert.description,
            variant: message.alert.severity === 'critical' || message.alert.severity === 'high' 
              ? "destructive" 
              : "default",
          });
          
          // Invalidate alert-related queries
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/alerts/counts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        }
        break;
        
      case 'honeypot_attack':
        if (message.alert) {
          toast({
            title: `${message.attack.service.toUpperCase()} Attack Detected`,
            description: `${message.attack.attackType} from ${message.attack.sourceIp}`,
            variant: message.attack.severity === 'high' || message.attack.severity === 'critical' 
              ? "destructive" 
              : "default",
          });
          
          // Invalidate honeypot-related queries
          queryClient.invalidateQueries({ queryKey: ['/api/honeypot/logs'] });
          queryClient.invalidateQueries({ queryKey: ['/api/honeypot/stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/alerts/counts'] });
        }
        break;
        
      case 'stats_update':
        if (message.stats) {
          // Invalidate system stats
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        }
        break;
    }
  };

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case '/': return 'Dashboard';
      case '/email-analysis': return 'Email Analysis';
      case '/deepfake-detection': return 'Deepfake Detection';
      case '/honeypot-monitor': return 'Honeypot Monitor';
      case '/ssh-honeypot-dashboard': return 'SSH Honeypot Dashboard';
      case '/threat-alerts': return 'Threat Alerts';
      case '/analytics': return 'Analytics';
      default: return 'CyberShield AI';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar alertCounts={alertCounts} />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header title={getPageTitle()} isSystemActive={isConnected} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/email-analysis" component={EmailAnalysis} />
            <Route path="/deepfake-detection" component={DeepfakeDetection} />
            <Route path="/honeypot-monitor" component={HoneypotMonitor} />
            <Route path="/ssh-honeypot-dashboard" component={SSHHoneypotDashboard} />
            <Route path="/threat-alerts" component={ThreatAlerts} />
            <Route path="/analytics" component={Analytics} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <AppContent />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
