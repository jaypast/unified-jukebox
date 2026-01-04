import { useState, useEffect, useRef } from "react";

interface WebSocketMessage {
  event: string;
  data: any;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closed'>('Connecting');
  const eventListeners = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setConnectionStatus('Open');
      setSocket(ws);
    };
    
    ws.onclose = () => {
      setConnectionStatus('Closed');
      setSocket(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Trigger event listeners
        const listeners = eventListeners.current.get(message.event) || [];
        listeners.forEach(listener => listener(message.data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message: object) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const addEventListener = (event: string, callback: (data: any) => void) => {
    const listeners = eventListeners.current.get(event) || [];
    listeners.push(callback);
    eventListeners.current.set(event, listeners);
  };

  const removeEventListener = (event: string, callback: (data: any) => void) => {
    const listeners = eventListeners.current.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      eventListeners.current.set(event, listeners);
    }
  };

  return {
    socket,
    lastMessage,
    connectionStatus,
    sendMessage,
    addEventListener,
    removeEventListener
  };
}
