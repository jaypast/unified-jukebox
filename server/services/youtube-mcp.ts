import { type SearchResult } from "@shared/schema";

export class YouTubeMCPService {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error("YouTube API key not configured");
    }

    try {
      // Enhance query for music content
      const musicQuery = `${query} music OR song OR audio`;
      
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(musicQuery)}&type=video&videoCategoryId=10&videoSyndicated=true&videoDuration=medium&maxResults=20&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }
      
      // Get video durations and filter out very long videos (likely not music)
      const videoIds = data.items.map((item: any) => item.id.videoId).join(",");
      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?part=contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`
      );
      
      const detailsData = await detailsResponse.json();
      
      return data.items
        .map((item: any, index: number) => {
          const details = detailsData.items?.[index];
          const duration = this.parseDuration(details?.contentDetails?.duration || "PT0S");
          
          // Filter out videos longer than 10 minutes (likely not music)
          if (duration > 600) return null;
          
          // Extract artist and title from video title
          const titleParts = this.extractArtistAndTitle(item.snippet.title);
          
          return {
            id: item.id.videoId,
            title: titleParts.title,
            artist: titleParts.artist || item.snippet.channelTitle,
            service: "youtube" as const,
            duration,
            thumbnail: item.snippet.thumbnails.medium?.url
          };
        })
        .filter(Boolean) as SearchResult[];
    } catch (error) {
      console.error("YouTube search error:", error);
      return [];
    }
  }

  private extractArtistAndTitle(videoTitle: string): { artist: string | null, title: string } {
    // Common patterns: "Artist - Title", "Artist: Title", "Title by Artist"
    const patterns = [
      /^(.+?)\s*-\s*(.+)$/,           // Artist - Title
      /^(.+?)\s*:\s*(.+)$/,           // Artist: Title  
      /^(.+)\s+by\s+(.+)$/i,          // Title by Artist
      /^(.+?)\s*\|\s*(.+)$/,          // Artist | Title
    ];

    for (const pattern of patterns) {
      const match = videoTitle.match(pattern);
      if (match) {
        if (pattern.source.includes('by')) {
          return { title: match[1].trim(), artist: match[2].trim() };
        } else {
          return { artist: match[1].trim(), title: match[2].trim() };
        }
      }
    }

    // If no pattern matches, return full title
    return { artist: null, title: videoTitle };
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async addToQueue(trackId: string): Promise<boolean> {
    // In a real implementation, this would add to YouTube queue
    return true;
  }

  async playTrack(trackId: string): Promise<boolean> {
    // In a real implementation, this would play the video
    return true;
  }

  async getCurrentTrack(): Promise<any> {
    return null;
  }

  async pausePlayback(): Promise<void> {
    // In a real implementation, this would pause YouTube playback
  }

  async skipTrack(): Promise<void> {
    // In a real implementation, this would skip to next video
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export const youtubeService = new YouTubeMCPService();
