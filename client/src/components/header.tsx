import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  isSystemActive?: boolean;
}

export function Header({ title, isSystemActive = true }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-surface shadow-sm border-b border-gray-700">
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isSystemActive ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-sm text-text-secondary">
              System {isSystemActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-white p-2"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-white p-2"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
