import { 
  tracks, 
  venueSettings, 
  type Track, 
  type InsertTrack, 
  type VenueSetting, 
  type InsertVenueSetting 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Track operations
  createTrack(track: InsertTrack): Promise<Track>;
  getTrack(id: number): Promise<Track | undefined>;
  getAllTracks(): Promise<Track[]>;
  getQueueTracks(): Promise<Track[]>;
  updateTrackStatus(id: number, status: string): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<boolean>;
  clearQueue(): Promise<void>;
  reorderQueue(trackIds: number[]): Promise<void>;
  
  // Venue settings operations
  createVenueSetting(setting: InsertVenueSetting): Promise<VenueSetting>;
  getVenueSetting(serviceName: string): Promise<VenueSetting | undefined>;
  getAllVenueSettings(): Promise<VenueSetting[]>;
  updateVenueSetting(serviceName: string, updates: Partial<VenueSetting>): Promise<VenueSetting | undefined>;
}

export class MemStorage implements IStorage {
  private tracks: Map<number, Track>;
  private venueSettings: Map<string, VenueSetting>;
  private currentTrackId: number;
  private currentSettingId: number;

  constructor() {
    this.tracks = new Map();
    this.venueSettings = new Map();
    this.currentTrackId = 1;
    this.currentSettingId = 1;
    
    // Initialize default venue settings
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings() {
    const defaultSettings: InsertVenueSetting[] = [
      { serviceName: "spotify", isActive: true, authToken: null },
      { serviceName: "youtube", isActive: true, authToken: null },
      { serviceName: "apple", isActive: false, authToken: null }
    ];
    
    defaultSettings.forEach(setting => {
      this.createVenueSetting(setting);
    });
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = this.currentTrackId++;
    const track = {
      id,
      trackId: insertTrack.trackId,
      service: insertTrack.service,
      title: insertTrack.title,
      artist: insertTrack.artist,
      album: insertTrack.album ?? null,
      duration: insertTrack.duration,
      thumbnailUrl: insertTrack.thumbnailUrl ?? null,
      requestedBy: insertTrack.requestedBy ?? null,
      requestedAt: new Date(),
      position: insertTrack.position,
      status: insertTrack.status || "pending",
    } as Track;
    this.tracks.set(id, track);
    return track;
  }

  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  async getQueueTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.status === "pending")
      .sort((a, b) => a.position - b.position);
  }

  async updateTrackStatus(id: number, status: string): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (track) {
      const updatedTrack = { ...track, status };
      this.tracks.set(id, updatedTrack);
      return updatedTrack;
    }
    return undefined;
  }

  async deleteTrack(id: number): Promise<boolean> {
    return this.tracks.delete(id);
  }

  async clearQueue(): Promise<void> {
    const tracksToDelete = Array.from(this.tracks.values())
      .filter(track => track.status === "pending");
    
    tracksToDelete.forEach(track => {
      this.tracks.delete(track.id);
    });
  }

  async reorderQueue(trackIds: number[]): Promise<void> {
    trackIds.forEach((id, index) => {
      const track = this.tracks.get(id);
      if (track && track.status === "pending") {
        this.tracks.set(id, { ...track, position: index });
      }
    });
  }

  async createVenueSetting(insertSetting: InsertVenueSetting): Promise<VenueSetting> {
    const id = this.currentSettingId++;
    const setting = {
      id,
      serviceName: insertSetting.serviceName,
      isActive: insertSetting.isActive ?? true,
      authToken: insertSetting.authToken || null,
      lastUpdated: new Date(),
    } as VenueSetting;
    this.venueSettings.set(insertSetting.serviceName, setting);
    return setting;
  }

  async getVenueSetting(serviceName: string): Promise<VenueSetting | undefined> {
    return this.venueSettings.get(serviceName);
  }

  async getAllVenueSettings(): Promise<VenueSetting[]> {
    return Array.from(this.venueSettings.values());
  }

  async updateVenueSetting(serviceName: string, updates: Partial<VenueSetting>): Promise<VenueSetting | undefined> {
    const setting = this.venueSettings.get(serviceName);
    if (setting) {
      const updatedSetting = { ...setting, ...updates, lastUpdated: new Date() };
      this.venueSettings.set(serviceName, updatedSetting);
      return updatedSetting;
    }
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  async initializeDefaultSettings() {
    // Check if default settings already exist
    const existingSettings = await this.getAllVenueSettings();
    if (existingSettings.length === 0) {
      const defaultSettings: InsertVenueSetting[] = [
        { serviceName: "spotify", isActive: true, authToken: null },
        { serviceName: "youtube", isActive: true, authToken: null },
        { serviceName: "apple", isActive: false, authToken: null }
      ];
      
      for (const setting of defaultSettings) {
        await this.createVenueSetting(setting);
      }
    }
  }
  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getQueueTracks(): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.status, "pending"))
      .orderBy(tracks.position);
  }

  async updateTrackStatus(id: number, status: string): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set({ status })
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }

  async deleteTrack(id: number): Promise<boolean> {
    const result = await db.delete(tracks).where(eq(tracks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearQueue(): Promise<void> {
    await db.delete(tracks).where(eq(tracks.status, "pending"));
  }

  async reorderQueue(trackIds: number[]): Promise<void> {
    for (let i = 0; i < trackIds.length; i++) {
      await db
        .update(tracks)
        .set({ position: i })
        .where(eq(tracks.id, trackIds[i]));
    }
  }

  async createVenueSetting(insertSetting: InsertVenueSetting): Promise<VenueSetting> {
    const [setting] = await db
      .insert(venueSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async getVenueSetting(serviceName: string): Promise<VenueSetting | undefined> {
    const [setting] = await db
      .select()
      .from(venueSettings)
      .where(eq(venueSettings.serviceName, serviceName));
    return setting || undefined;
  }

  async getAllVenueSettings(): Promise<VenueSetting[]> {
    return await db.select().from(venueSettings);
  }

  async updateVenueSetting(serviceName: string, updates: Partial<VenueSetting>): Promise<VenueSetting | undefined> {
    const [setting] = await db
      .update(venueSettings)
      .set(updates)
      .where(eq(venueSettings.serviceName, serviceName))
      .returning();
    return setting || undefined;
  }
}

export const storage = new DatabaseStorage();
