import { storage } from "../storage";
import { type Track, type InsertTrack } from "@shared/schema";
import { WebSocket } from "ws";

export class QueueManager {
  private currentTrack: Track | null = null;
  private isPlaying = false;
  private playbackStartTime: number | null = null;
  private websockets: Set<WebSocket> = new Set();

  addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
    ws.on('close', () => {
      this.websockets.delete(ws);
    });
  }

  private broadcast(event: string, data: any) {
    const message = JSON.stringify({ event, data });
    this.websockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  async addToQueue(track: InsertTrack): Promise<Track> {
    const queueTracks = await storage.getQueueTracks();
    const position = queueTracks.length;
    
    const newTrack = await storage.createTrack({
      ...track,
      position
    });

    this.broadcast('queue_updated', await this.getQueueStatus());
    return newTrack;
  }

  async getQueueStatus() {
    const queueTracks = await storage.getQueueTracks();
    return {
      currentTrack: this.currentTrack,
      upcoming: queueTracks,
      totalTracks: queueTracks.length + (this.currentTrack ? 1 : 0)
    };
  }

  async playNext(): Promise<Track | null> {
    if (this.currentTrack) {
      await storage.updateTrackStatus(this.currentTrack.id, "played");
    }

    const queueTracks = await storage.getQueueTracks();
    if (queueTracks.length > 0) {
      const nextTrack = queueTracks[0];
      this.currentTrack = await storage.updateTrackStatus(nextTrack.id, "playing");
      this.isPlaying = true;
      this.playbackStartTime = Date.now();
      
      this.broadcast('track_changed', this.currentTrack);
      this.broadcast('playback_status', this.getPlaybackStatus());
      this.broadcast('queue_updated', await this.getQueueStatus());
      
      return this.currentTrack;
    }

    this.currentTrack = null;
    this.isPlaying = false;
    this.playbackStartTime = null;
    this.broadcast('track_changed', null);
    this.broadcast('playback_status', this.getPlaybackStatus());
    return null;
  }

  async skipTrack(): Promise<Track | null> {
    if (this.currentTrack) {
      await storage.updateTrackStatus(this.currentTrack.id, "skipped");
    }
    return this.playNext();
  }

  async pausePlayback(): Promise<void> {
    this.isPlaying = false;
    this.broadcast('playback_status', this.getPlaybackStatus());
  }

  async resumePlayback(): Promise<void> {
    this.isPlaying = true;
    this.broadcast('playback_status', this.getPlaybackStatus());
  }

  async removeFromQueue(trackId: number): Promise<void> {
    await storage.deleteTrack(trackId);
    this.broadcast('queue_updated', await this.getQueueStatus());
  }

  async clearQueue(): Promise<void> {
    await storage.clearQueue();
    this.broadcast('queue_updated', await this.getQueueStatus());
  }

  async reorderQueue(trackIds: number[]): Promise<void> {
    await storage.reorderQueue(trackIds);
    this.broadcast('queue_updated', await this.getQueueStatus());
  }

  getPlaybackStatus() {
    if (!this.currentTrack) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        track: null
      };
    }

    const currentTime = this.playbackStartTime && this.isPlaying 
      ? Math.floor((Date.now() - this.playbackStartTime) / 1000)
      : 0;

    return {
      isPlaying: this.isPlaying,
      currentTime: Math.min(currentTime, this.currentTrack.duration),
      duration: this.currentTrack.duration,
      track: this.currentTrack
    };
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }
}

export const queueManager = new QueueManager();
