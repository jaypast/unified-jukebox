import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { type Track, type PlaybackStatus } from "@shared/schema";

interface NowPlayingProps {
  playbackStatus: PlaybackStatus;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  isAdmin?: boolean;
}

export default function NowPlaying({ 
  playbackStatus, 
  onPlay, 
  onPause, 
  onSkip, 
  isAdmin = false 
}: NowPlayingProps) {
  const { isPlaying, currentTime, duration, track } = playbackStatus;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'spotify':
        return <i className="fab fa-spotify text-green-500" />;
      case 'youtube':
        return <i className="fab fa-youtube text-red-500" />;
      case 'apple':
        return <i className="fab fa-apple text-gray-400" />;
      default:
        return null;
    }
  };

  if (!track) {
    return (
      <Card className="bg-white border border-gray-300">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-black mb-4">
            <Play className="inline mr-2" />
            Now Playing
          </h2>
          <div className="text-center py-8 text-gray-500">
            <Play className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No track playing</p>
            <p className="text-sm">Add songs to the queue to start playing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-300">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          <Play className="inline mr-2" />
          Now Playing
        </h2>
        
        <div className="space-y-4">
          {/* Track Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-black">{track.title}</div>
              <div className="text-gray-600 text-sm">{track.artist}</div>
              <div className="flex items-center justify-center space-x-2 mt-2">
                {getServiceIcon(track.service)}
                <span className="text-xs text-gray-500 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Playback Controls */}
          {isAdmin && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                size="icon"
                variant="outline"
                className="bg-white hover:bg-gray-100 text-black border-gray-300"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={isPlaying ? onPause : onPlay}
                className={`w-12 h-12 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={onSkip}
                className="bg-white hover:bg-gray-100 text-black border-gray-300"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          {/* Volume Control */}
          {isAdmin && (
            <div className="flex items-center space-x-3 pt-4">
              <VolumeX className="h-4 w-4 text-gray-500" />
              <Slider
                defaultValue={[75]}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
