import { type SearchResult } from "@shared/schema";
import { spotifyService } from "./spotify-mcp";
import { youtubeService } from "./youtube-mcp";
import { appleMusicService } from "./apple-music-mcp";
import { storage } from "../storage";

export interface MCPService {
  search(query: string): Promise<SearchResult[]>;
  addToQueue(trackId: string): Promise<boolean>;
  playTrack(trackId: string): Promise<boolean>;
  getCurrentTrack(): Promise<any>;
  pausePlayback(): Promise<void>;
  skipTrack(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

export class MCPManager {
  private services: Map<string, MCPService> = new Map();

  constructor() {
    this.services.set("spotify", spotifyService);
    this.services.set("youtube", youtubeService);
    this.services.set("apple", appleMusicService);
  }

  async searchAll(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const venueSettings = await storage.getAllVenueSettings();
    
    // Get active services from venue settings
    const activeServices = venueSettings
      .filter(setting => setting.isActive)
      .map(setting => setting.serviceName);

    // Search across all active services concurrently
    const searchPromises = activeServices.map(async (serviceName) => {
      const service = this.services.get(serviceName);
      if (!service) return [];

      try {
        const isAuth = await service.isAuthenticated();
        if (!isAuth) {
          console.log(`${serviceName} service not authenticated`);
          return [];
        }

        const serviceResults = await service.search(query);
        return serviceResults;
      } catch (error) {
        console.error(`${serviceName} search failed:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    
    // Flatten and combine results
    for (const serviceResults of allResults) {
      results.push(...serviceResults);
    }

    // Sort by relevance (could be enhanced with more sophisticated ranking)
    return this.rankResults(results, query);
  }

  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Calculate relevance score for each result
      const scoreA = this.calculateRelevance(a, queryLower);
      const scoreB = this.calculateRelevance(b, queryLower);
      
      return scoreB - scoreA; // Higher score first
    });
  }

  private calculateRelevance(result: SearchResult, query: string): number {
    let score = 0;
    const titleLower = result.title.toLowerCase();
    const artistLower = result.artist.toLowerCase();
    
    // Exact title match gets highest score
    if (titleLower === query) score += 100;
    // Title starts with query
    else if (titleLower.startsWith(query)) score += 80;
    // Title contains query
    else if (titleLower.includes(query)) score += 60;
    
    // Artist exact match
    if (artistLower === query) score += 90;
    // Artist starts with query
    else if (artistLower.startsWith(query)) score += 70;
    // Artist contains query
    else if (artistLower.includes(query)) score += 50;
    
    // Prefer shorter durations (more likely to be songs vs long videos)
    if (result.duration > 0 && result.duration < 600) score += 10;
    
    // Service preference (could be made configurable)
    switch (result.service) {
      case "spotify": score += 5; break;
      case "apple": score += 3; break;
      case "youtube": score += 1; break;
    }
    
    return score;
  }

  async getActiveServices(): Promise<string[]> {
    const venueSettings = await storage.getAllVenueSettings();
    return venueSettings
      .filter(setting => setting.isActive)
      .map(setting => setting.serviceName);
  }

  async getServiceStatus(): Promise<Record<string, { active: boolean, authenticated: boolean }>> {
    const venueSettings = await storage.getAllVenueSettings();
    const status: Record<string, { active: boolean, authenticated: boolean }> = {};

    for (const setting of venueSettings) {
      const service = this.services.get(setting.serviceName);
      const authenticated = service ? await service.isAuthenticated() : false;
      
      status[setting.serviceName] = {
        active: setting.isActive,
        authenticated
      };
    }

    return status;
  }

  getService(serviceName: string): MCPService | undefined {
    return this.services.get(serviceName);
  }
}

export const mcpManager = new MCPManager();