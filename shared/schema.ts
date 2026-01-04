import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  trackId: text("track_id").notNull(),
  service: text("service").notNull(), // spotify, youtube, apple
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: integer("duration").notNull(), // seconds
  thumbnailUrl: text("thumbnail_url"),
  requestedBy: text("requested_by"),
  requestedAt: timestamp("requested_at").defaultNow(),
  position: integer("position").notNull(),
  status: text("status").notNull().default("pending"), // pending, playing, played, skipped
});

export const venueSettings = pgTable("venue_settings", {
  id: serial("id").primaryKey(),
  serviceName: text("service_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  authToken: text("auth_token"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  requestedAt: true,
});

export const insertVenueSettingSchema = createInsertSchema(venueSettings).omit({
  id: true,
  lastUpdated: true,
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type VenueSetting = typeof venueSettings.$inferSelect;
export type InsertVenueSetting = z.infer<typeof insertVenueSettingSchema>;

// API Response types
export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  service: "spotify" | "youtube" | "apple";
  duration: number;
  thumbnail?: string;
}

export interface QueueResponse {
  currentTrack: Track | null;
  upcoming: Track[];
  totalTracks: number;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  track: Track | null;
}
