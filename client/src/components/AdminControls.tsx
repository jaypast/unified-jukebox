import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Pause, Square, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { type VenueSetting } from "@shared/schema";

interface AdminControlsProps {
  venueSettings: VenueSetting[];
  onUpdateSetting: (serviceName: string, updates: Partial<VenueSetting>) => void;
  onPauseAll: () => void;
  onStopAll: () => void;
}

export default function AdminControls({ 
  venueSettings, 
  onUpdateSetting, 
  onPauseAll, 
  onStopAll 
}: AdminControlsProps) {
  const [explicitFilter, setExplicitFilter] = useState(true);
  const [limitQueue, setLimitQueue] = useState(false);
  const [autoSkipLong, setAutoSkipLong] = useState(false);

  const getServiceStatus = (setting: VenueSetting) => {
    if (!setting.isActive) {
      return { icon: <AlertCircle className="h-3 w-3" />, text: "Disabled", color: "text-gray-400" };
    }
    if (setting.authToken) {
      return { icon: <CheckCircle className="h-3 w-3" />, text: "Connected", color: "text-green-600" };
    }
    return { icon: <Clock className="h-3 w-3" />, text: "Connecting...", color: "text-gray-500" };
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'spotify':
        return <i className="fab fa-spotify text-green-500" />;
      case 'youtube':
        return <i className="fab fa-youtube text-red-500" />;
      case 'apple':
        return <i className="fab fa-apple text-gray-400" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-white border border-gray-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-black">
          <Settings className="inline mr-2" />
          Admin Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Service Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Service Status</h3>
          {venueSettings.map((setting) => {
            const status = getServiceStatus(setting);
            return (
              <div key={setting.serviceName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getServiceIcon(setting.serviceName)}
                  <span className="capitalize text-black">{setting.serviceName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 ${status.color}`}>
                    {status.icon}
                    <span className="text-xs">{status.text}</span>
                  </div>
                  <Switch
                    checked={setting.isActive}
                    onCheckedChange={(checked) => 
                      onUpdateSetting(setting.serviceName, { isActive: checked })
                    }
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Content Filters */}
        <div className="border-t border-gray-300 pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Content Filters</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="explicit-filter" className="text-sm text-black">Block Explicit Content</Label>
              <Switch
                id="explicit-filter"
                checked={explicitFilter}
                onCheckedChange={setExplicitFilter}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="limit-queue" className="text-sm text-black">Limit Queue per User</Label>
              <Switch
                id="limit-queue"
                checked={limitQueue}
                onCheckedChange={setLimitQueue}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-skip" className="text-sm text-black">Auto-Skip Long Songs</Label>
              <Switch
                id="auto-skip"
                checked={autoSkipLong}
                onCheckedChange={setAutoSkipLong}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>
          </div>
        </div>
        
        {/* Emergency Controls */}
        <div className="border-t border-gray-300 pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Emergency Controls</h3>
          <div className="flex space-x-2">
            <Button
              onClick={onPauseAll}
              className="flex-1 bg-white hover:bg-gray-50 text-black border border-gray-300"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause All
            </Button>
            <Button
              onClick={onStopAll}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              size="sm"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
