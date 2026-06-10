/// <reference types="vite/client" />
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5; // Limit reconnect attempts to avoid spamming

interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp: string;
}

type MessageHandler = (data: unknown) => void;

export function useWebSocket(userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(!!import.meta.env.VITE_WS_URL); // Only enable if WS_URL is explicitly set

  const connect = useCallback(() => {
    // Don't try to connect if not enabled
    if (!isEnabled) {
      console.log('[WS] WebSocket connection disabled');
      setIsConnected(false);
      setConnectionError('WebSocket connection is disabled');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Stop reconnecting after max attempts
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] Max reconnect attempts reached');
      setConnectionError('Unable to connect to live data server');
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection

        // Authenticate if userId provided
        if (userId) {
          ws.send(JSON.stringify({ type: 'auth', userId }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handlers = handlersRef.current.get(message.event);
          
          if (handlers) {
            handlers.forEach(handler => handler(message.data));
          }

          // Also call wildcard handlers
          const wildcardHandlers = handlersRef.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => handler(message));
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect only if enabled and haven't hit max attempts
        if (isEnabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WS] Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            // Use window.dispatchEvent or a simple trigger to call connect again
            // or just call the function directly since it's now a named function in the closure
            void connect();
          }, 3000 * reconnectAttemptsRef.current); // Backoff: 3s, 6s, 9s, etc.
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Unable to connect to live data server');
        }
      };

      ws.onerror = (error) => {
        console.warn('[WS] Connection error occurred (this is expected if no server is running):', error);
        // Don't set connection error here - let onclose handle it to avoid duplicate errors
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setConnectionError('Failed to establish WebSocket connection');
      reconnectAttemptsRef.current++;
    }
  }, [userId, isEnabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const subscribe = useCallback((event: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }
    };
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Tried to send message but not connected');
    }
  }, []);

  useEffect(() => {
    if (isEnabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, isEnabled]);

  return {
    isConnected,
    connectionError,
    subscribe,
    send,
    reconnect: connect,
    isEnabled,
    setIsEnabled,
  };
}

// Hook specifically for batch progress updates
export function useBatchProgress(batchId: string | null) {
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    successCount: number;
    failCount: number;
  } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!batchId) return;

    const unsubProgress = subscribe('batch:progress', (data: unknown) => {
      const d = data as { batchId: string; processed: number; total: number; successCount: number; failCount: number };
      if (d.batchId === batchId) {
        setProgress({
          processed: d.processed,
          total: d.total,
          successCount: d.successCount,
          failCount: d.failCount,
        });
      }
    });

    const unsubStatus = subscribe('batch:status', (data: unknown) => {
      const d = data as { batchId: string; status: string };
      if (d.batchId === batchId) {
        setStatus(d.status);
      }
    });

    const unsubCompleted = subscribe('batch:completed', (data: unknown) => {
      const d = data as { batchId: string; status: string; successCount: number; failCount: number };
      if (d.batchId === batchId) {
        setStatus(d.status);
        setProgress(prev => prev ? { ...prev, successCount: d.successCount, failCount: d.failCount } : null);
      }
    });

    return () => {
      unsubProgress();
      unsubStatus();
      unsubCompleted();
    };
  }, [batchId, subscribe]);

  return { progress, status, isConnected };
}

// Hook for notifications
export function useNotificationSocket(userId: string | undefined) {
  const [newNotification, setNewNotification] = useState<unknown | null>(null);
  const { subscribe } = useWebSocket(userId);

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribe('notification:new', (data: unknown) => {
      setNewNotification(data);
    });

    return unsub;
  }, [userId, subscribe]);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return { newNotification, clearNewNotification };
}
