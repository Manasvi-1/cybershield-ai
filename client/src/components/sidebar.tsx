import { Link, useLocation } from "wouter";
import { 
  Shield, 
  BarChart3, 
  Mail, 
  Video, 
  Bug, 
  Bell, 
  TrendingUp,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertCounts } from "@/lib/types";

interface SidebarProps {
  alertCounts?: AlertCounts;
}

export function Sidebar({ alertCounts }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
      active: location === "/",
    },
    {
      name: "Email Analysis",
      href: "/email-analysis",
      icon: Mail,
      active: location === "/email-analysis",
    },
    {
      name: "Deepfake Detection",
      href: "/deepfake-detection",
      icon: Video,
      active: location === "/deepfake-detection",
    },
    {
      name: "Honeypot Monitor",
      href: "/honeypot-monitor",
      icon: Bug,
      active: location === "/honeypot-monitor",
    },
    {
      name: "SSH Honeypot",
      href: "/ssh-honeypot-dashboard",
      icon: Terminal,
      active: location === "/ssh-honeypot-dashboard",
    },
    {
      name: "Threat Alerts",
      href: "/threat-alerts",
      icon: Bell,
      active: location === "/threat-alerts",
      badge: alertCounts ? alertCounts.critical + alertCounts.high : 0,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: TrendingUp,
      active: location === "/analytics",
    },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-surface border-r border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-white">CyberShield AI</h1>
            </div>
          </div>
          
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                      item.active
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-destructive text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
