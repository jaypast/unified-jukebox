import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ServiceStatusProps {
  className?: string;
}

interface ServiceStatus {
  active: boolean;
  authenticated: boolean;
}

interface ServiceStatusResponse {
  [serviceName: string]: ServiceStatus;
}

export default function ServiceStatus({ className }: ServiceStatusProps) {
  const { data: serviceStatus, isLoading } = useQuery<ServiceStatusResponse>({
    queryKey: ["/api/admin/service-status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getServiceIcon = (serviceName: string) => {
    const iconClass = "h-4 w-4";
    switch (serviceName) {
      case 'spotify':
        return <div className={`${iconClass} bg-green-500 rounded-full`} />;
      case 'youtube':
        return <div className={`${iconClass} bg-red-500 rounded-full`} />;
      case 'apple':
        return <div className={`${iconClass} bg-gray-400 rounded-full`} />;
      default:
        return <div className={`${iconClass} bg-gray-300 rounded-full`} />;
    }
  };

  const getStatusInfo = (status: ServiceStatus) => {
    if (!status.active) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: "Disabled",
        variant: "secondary" as const,
        color: "text-gray-400"
      };
    }
    if (status.authenticated) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Connected",
        variant: "default" as const,
        color: "text-green-600"
      };
    }
    return {
      icon: <Clock className="h-3 w-3" />,
      text: "Not Auth",
      variant: "destructive" as const,
      color: "text-red-600"
    };
  };

  const getServiceDisplayName = (serviceName: string) => {
    switch (serviceName) {
      case 'spotify': return 'Spotify';
      case 'youtube': return 'YouTube';
      case 'apple': return 'Apple Music';
      default: return serviceName;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Music Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading service status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Music Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {serviceStatus && Object.entries(serviceStatus).map(([serviceName, status]) => {
          const statusInfo = getStatusInfo(status);
          return (
            <div key={serviceName} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getServiceIcon(serviceName)}
                <span className="text-sm font-medium">
                  {getServiceDisplayName(serviceName)}
                </span>
              </div>
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                <span className="text-xs">{statusInfo.text}</span>
              </Badge>
            </div>
          );
        })}
        {(!serviceStatus || Object.keys(serviceStatus).length === 0) && (
          <div className="text-sm text-gray-500">No services configured</div>
        )}
      </CardContent>
    </Card>
  );
}