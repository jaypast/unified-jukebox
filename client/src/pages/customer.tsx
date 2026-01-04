import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Music, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import SearchBar from "@/components/SearchBar";
import QueueDisplay from "@/components/QueueDisplay";
import { searchTracks, addToQueue, getQueue } from "@/lib/api";
import { type SearchResult } from "@shared/schema";

export default function CustomerInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connectionStatus, addEventListener } = useWebSocket('/ws');

  // Get queue data
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['/api/queue'],
    queryFn: getQueue,
    refetchInterval: 5000,
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: searchTracks,
    onSuccess: (data) => {
      setSearchResults(data.results);
      setIsSearching(false);
    },
    onError: (error) => {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search tracks. Please try again.",
        variant: "destructive",
      });
      setIsSearching(false);
    }
  });

  // Add to queue mutation
  const addToQueueMutation = useMutation({
    mutationFn: addToQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      toast({
        title: "Added to Queue",
        description: "Track has been added to the queue!",
      });
    },
    onError: (error) => {
      console.error('Add to queue error:', error);
      toast({
        title: "Error",
        description: "Failed to add track to queue. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    searchMutation.mutate(query);
  };

  // Handle add to queue
  const handleAddToQueue = (track: SearchResult) => {
    addToQueueMutation.mutate({
      trackId: track.id,
      service: track.service,
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      duration: track.duration,
      thumbnailUrl: track.thumbnail || "",
      requestedBy: "customer",
      position: 0,
      status: "pending"
    });
  };

  // WebSocket event listeners
  useEffect(() => {
    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    };

    const handleTrackChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
    };

    addEventListener('queue_updated', handleQueueUpdate);
    addEventListener('track_changed', handleTrackChanged);
  }, [addEventListener, queryClient]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className="min-h-screen bg-space-gray text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-electric-blue/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-orbitron font-bold text-electric-blue neon-text">
                <Music className="inline mr-2" />
                UNIFIED JUKEBOX
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'Open' ? 'bg-bright-green animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-300">
                  {connectionStatus === 'Open' ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Search & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl neon-border p-8 holographic-bg">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/20 to-neon-pink/20" />
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-electric-blue neon-text mb-4 animate-glow">
                  Choose Your Sound
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                  Search across Spotify, YouTube, and Apple Music from one interface
                </p>
                
                {/* Search Bar */}
                <SearchBar onSearch={handleSearch} isLoading={isSearching} />
                
                {/* Service Status */}
                <div className="flex items-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-bright-green rounded-full animate-pulse" />
                    <i className="fab fa-spotify text-green-500" />
                    <span className="text-sm">Spotify</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-bright-green rounded-full animate-pulse" />
                    <i className="fab fa-youtube text-red-500" />
                    <span className="text-sm">YouTube</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <i className="fab fa-apple text-gray-400" />
                    <span className="text-sm">Apple Music</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {(searchResults.length > 0 || isSearching) && (
              <Card className="bg-gray-900 neon-border">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-orbitron font-bold text-neon-pink mb-4 neon-text">
                    <i className="fas fa-search mr-2" />
                    Search Results
                  </h2>
                  
                  {isSearching ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue mx-auto mb-4" />
                      <p className="text-gray-400">Searching across all services...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Music className="mx-auto h-12 w-12 mb-2 opacity-50" />
                      <p>No results found</p>
                      <p className="text-sm">Try searching for a different song or artist</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((track) => (
                        <div key={`${track.service}-${track.id}`} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/80 transition-all cursor-pointer group queue-item">
                          <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-neon-pink rounded-lg flex items-center justify-center">
                            {track.thumbnail ? (
                              <img 
                                src={track.thumbnail} 
                                alt={track.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Music className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white group-hover:text-electric-blue transition-colors">
                              {track.title}
                            </h3>
                            <p className="text-gray-400 text-sm">{track.artist}</p>
                            {track.album && (
                              <p className="text-gray-500 text-xs">{track.album}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              {getServiceIcon(track.service)}
                              <span className="text-xs text-gray-500 font-mono">
                                {formatDuration(track.duration)}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddToQueue(track)}
                            disabled={addToQueueMutation.isPending}
                            className="bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 transition-all border border-electric-blue/30 touch-target"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Queue
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Queue Display */}
          <div className="space-y-6">
            {queueLoading ? (
              <Card className="bg-gray-900 neon-border">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-700 rounded w-1/2" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-700 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <QueueDisplay
                currentTrack={queueData?.currentTrack || null}
                upcomingTracks={queueData?.upcoming || []}
                onRemoveTrack={() => {}} // Customer can't remove tracks
                onClearQueue={() => {}} // Customer can't clear queue
                isAdmin={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
