import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Music } from "lucide-react";
import { type Track } from "@shared/schema";

interface QueueDisplayProps {
  currentTrack: Track | null;
  upcomingTracks: Track[];
  onRemoveTrack: (trackId: number) => void;
  onClearQueue: () => void;
  isAdmin?: boolean;
}

export default function QueueDisplay({ 
  currentTrack, 
  upcomingTracks, 
  onRemoveTrack, 
  onClearQueue,
  isAdmin = false 
}: QueueDisplayProps) {
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'spotify':
        return <i className="fab fa-spotify text-green-500 text-sm" />;
      case 'youtube':
        return <i className="fab fa-youtube text-red-500 text-sm" />;
      case 'apple':
        return <i className="fab fa-apple text-gray-400 text-sm" />;
      default:
        return <Music className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white border border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">
            <Music className="inline mr-2" />
            Queue
          </h2>
          <Badge variant="secondary" className="bg-gray-200 text-black">
            {upcomingTracks.length} tracks
          </Badge>
        </div>

        {/* Current Track */}
        {currentTrack && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 font-semibold">NOW PLAYING</span>
              </div>
              {getServiceIcon(currentTrack.service)}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold text-black">{currentTrack.title}</h3>
              <p className="text-gray-600 text-sm">{currentTrack.artist}</p>
              <p className="text-gray-500 text-xs font-mono">{formatDuration(currentTrack.duration)}</p>
            </div>
          </div>
        )}

        {/* Upcoming Tracks */}
        <div className="space-y-3">
          {upcomingTracks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Music className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No tracks in queue</p>
              <p className="text-sm">Search and add songs to get started</p>
            </div>
          ) : (
            upcomingTracks.map((track, index) => (
              <div key={track.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Music className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black truncate">{track.title}</p>
                  <p className="text-gray-600 text-xs truncate">{track.artist}</p>
                  <p className="text-gray-500 text-xs font-mono">{formatDuration(track.duration)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getServiceIcon(track.service)}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveTrack(track.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Queue Controls */}
        {isAdmin && upcomingTracks.length > 0 && (
          <div className="flex items-center justify-end pt-4 border-t border-gray-300 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearQueue}
              className="bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
