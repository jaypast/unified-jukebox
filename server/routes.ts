import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { queueManager } from "./services/queue-manager";
import { mcpManager } from "./services/mcp-manager";
import { insertTrackSchema, type SearchResult } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    queueManager.addWebSocket(ws);
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Search across all services
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      // Use MCP manager to search across all active services
      const results = await mcpManager.searchAll(query);
      res.json({ results });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add song to queue
  app.post("/api/queue/add", async (req, res) => {
    try {
      const validatedData = insertTrackSchema.parse(req.body);
      const track = await queueManager.addToQueue(validatedData);
      res.json({ success: true, track });
    } catch (error) {
      console.error("Add to queue error:", error);
      res.status(400).json({ error: "Invalid track data" });
    }
  });

  // Get current queue
  app.get("/api/queue", async (req, res) => {
    try {
      const queueStatus = await queueManager.getQueueStatus();
      res.json(queueStatus);
    } catch (error) {
      console.error("Get queue error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get playback status
  app.get("/api/playback/status", async (req, res) => {
    try {
      const status = queueManager.getPlaybackStatus();
      res.json(status);
    } catch (error) {
      console.error("Get playback status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Skip track
  app.post("/api/admin/skip", async (req, res) => {
    try {
      const nextTrack = await queueManager.skipTrack();
      res.json({ success: true, nextTrack });
    } catch (error) {
      console.error("Skip track error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Pause playback
  app.post("/api/admin/pause", async (req, res) => {
    try {
      await queueManager.pausePlayback();
      res.json({ success: true });
    } catch (error) {
      console.error("Pause playback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Resume playback
  app.post("/api/admin/play", async (req, res) => {
    try {
      await queueManager.resumePlayback();
      res.json({ success: true });
    } catch (error) {
      console.error("Resume playback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Remove track from queue
  app.delete("/api/admin/queue/:trackId", async (req, res) => {
    try {
      const trackId = parseInt(req.params.trackId);
      await queueManager.removeFromQueue(trackId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove track error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Clear queue
  app.delete("/api/admin/queue", async (req, res) => {
    try {
      await queueManager.clearQueue();
      res.json({ success: true });
    } catch (error) {
      console.error("Clear queue error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Reorder queue
  app.post("/api/admin/queue/reorder", async (req, res) => {
    try {
      const { trackIds } = req.body;
      await queueManager.reorderQueue(trackIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Reorder queue error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get venue settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getAllVenueSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update venue setting
  app.patch("/api/admin/settings/:serviceName", async (req, res) => {
    try {
      const { serviceName } = req.params;
      const updates = req.body;
      const setting = await storage.updateVenueSetting(serviceName, updates);
      res.json(setting);
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get service status (authentication and activity)
  app.get("/api/admin/service-status", async (req, res) => {
    try {
      const status = await mcpManager.getServiceStatus();
      res.json(status);
    } catch (error) {
      console.error("Get service status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Start playing next track if none is playing
  app.post("/api/admin/play-next", async (req, res) => {
    try {
      const nextTrack = await queueManager.playNext();
      res.json({ success: true, nextTrack });
    } catch (error) {
      console.error("Play next error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
