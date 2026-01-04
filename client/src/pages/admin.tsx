import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import NowPlaying from "@/components/NowPlaying";
import QueueDisplay from "@/components/QueueDisplay";
import AdminControls from "@/components/AdminControls";
import ServiceStatus from "@/components/ServiceStatus";
import { 
  getQueue, 
  getPlaybackStatus, 
  skipTrack, 
  pausePlayback, 
  resumePlayback, 
  removeFromQueue,
  clearQueue,
  getVenueSettings,
  updateVenueSetting
} from "@/lib/api";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connectionStatus, addEventListener } = useWebSocket('/ws');

  // Get queue data
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['/api/queue'],
    queryFn: getQueue,
    refetchInterval: 2000,
  });

  // Get playback status
  const { data: playbackStatus, isLoading: playbackLoading } = useQuery({
    queryKey: ['/api/playback/status'],
    queryFn: getPlaybackStatus,
    refetchInterval: 1000,
  });

  // Get venue settings
  const { data: venueSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: getVenueSettings,
  });

  // Skip track mutation
  const skipMutation = useMutation({
    mutationFn: skipTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playback/status'] });
      toast({
        title: "Track Skipped",
        description: "Playing next track in queue",
      });
    },
    onError: (error) => {
      console.error('Skip error:', error);
      toast({
        title: "Error",
        description: "Failed to skip track",
        variant: "destructive",
      });
    }
  });

  // Pause/Resume mutations
  const pauseMutation = useMutation({
    mutationFn: pausePlayback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playback/status'] });
    }
  });

  const resumeMutation = useMutation({
    mutationFn: resumePlayback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playback/status'] });
    }
  });

  // Remove from queue mutation
  const removeMutation = useMutation({
    mutationFn: removeFromQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Track Removed",
        description: "Track has been removed from queue",
      });
    }
  });

  // Clear queue mutation
  const clearQueueMutation = useMutation({
    mutationFn: clearQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Queue Cleared",
        description: "All tracks have been removed from queue",
      });
    }
  });

  // Update venue setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ serviceName, updates }: { serviceName: string; updates: any }) => 
      updateVenueSetting(serviceName, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings Updated",
        description: "Venue settings have been updated",
      });
    }
  });

  // WebSocket event listeners
  useEffect(() => {
    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    };

    const handleTrackChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playback/status'] });
    };

    const handlePlaybackStatus = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playback/status'] });
    };

    addEventListener('queue_updated', handleQueueUpdate);
    addEventListener('track_changed', handleTrackChanged);
    addEventListener('playback_status', handlePlaybackStatus);
  }, [addEventListener, queryClient]);

  const handlePlay = () => {
    resumeMutation.mutate();
  };

  const handlePause = () => {
    pauseMutation.mutate();
  };

  const handleSkip = () => {
    skipMutation.mutate();
  };

  const handleRemoveTrack = (trackId: number) => {
    removeMutation.mutate(trackId);
  };

  const handleClearQueue = () => {
    clearQueueMutation.mutate();
  };

  const handleUpdateSetting = (serviceName: string, updates: any) => {
    updateSettingMutation.mutate({ serviceName, updates });
  };

  const handlePauseAll = () => {
    pauseMutation.mutate();
  };

  const handleStopAll = () => {
    // In a real implementation, this would stop all services
    pauseMutation.mutate();
  };

  if (queueLoading || playbackLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-space-gray text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customer
                </Button>
              </Link>
              <div className="text-2xl font-bold text-white">
                <Settings className="inline mr-2" />
                ADMIN DASHBOARD
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'Open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-sm text-white">
                  {connectionStatus === 'Open' ? 'Live' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Admin Mode</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Now Playing & Queue */}
          <div className="lg:col-span-2 space-y-6">
            <NowPlaying
              playbackStatus={playbackStatus || { isPlaying: false, currentTime: 0, duration: 0, track: null }}
              onPlay={handlePlay}
              onPause={handlePause}
              onSkip={handleSkip}
              isAdmin={true}
            />
            
            <QueueDisplay
              currentTrack={queueData?.currentTrack || null}
              upcomingTracks={queueData?.upcoming || []}
              onRemoveTrack={handleRemoveTrack}
              onClearQueue={handleClearQueue}
              isAdmin={true}
            />
          </div>

          {/* Admin Controls */}
          <div className="space-y-6">
            <ServiceStatus />
            <AdminControls
              venueSettings={venueSettings || []}
              onUpdateSetting={handleUpdateSetting}
              onPauseAll={handlePauseAll}
              onStopAll={handleStopAll}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
