import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor, bgColor }: StatsCardProps) {
  return (
    <Card className="bg-surface border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-text-secondary truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-white">{value}</dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
