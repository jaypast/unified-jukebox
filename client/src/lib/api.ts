import { apiRequest } from "./queryClient";
import { type SearchResult, type QueueResponse, type PlaybackStatus } from "@shared/schema";

export const searchTracks = async (query: string): Promise<{ results: SearchResult[] }> => {
  const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

export const addToQueue = async (track: any) => {
  const response = await apiRequest("POST", "/api/queue/add", track);
  return response.json();
};

export const getQueue = async (): Promise<QueueResponse> => {
  const response = await apiRequest("GET", "/api/queue");
  return response.json();
};

export const getPlaybackStatus = async (): Promise<PlaybackStatus> => {
  const response = await apiRequest("GET", "/api/playback/status");
  return response.json();
};

export const skipTrack = async () => {
  const response = await apiRequest("POST", "/api/admin/skip");
  return response.json();
};

export const pausePlayback = async () => {
  const response = await apiRequest("POST", "/api/admin/pause");
  return response.json();
};

export const resumePlayback = async () => {
  const response = await apiRequest("POST", "/api/admin/play");
  return response.json();
};

export const removeFromQueue = async (trackId: number) => {
  const response = await apiRequest("DELETE", `/api/admin/queue/${trackId}`);
  return response.json();
};

export const clearQueue = async () => {
  const response = await apiRequest("DELETE", "/api/admin/queue");
  return response.json();
};

export const playNext = async () => {
  const response = await apiRequest("POST", "/api/admin/play-next");
  return response.json();
};

export const getVenueSettings = async () => {
  const response = await apiRequest("GET", "/api/admin/settings");
  return response.json();
};

export const updateVenueSetting = async (serviceName: string, updates: any) => {
  const response = await apiRequest("PATCH", `/api/admin/settings/${serviceName}`, updates);
  return response.json();
};
