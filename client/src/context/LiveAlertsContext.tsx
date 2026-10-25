import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { FoodBatch } from '../types';

interface LiveAlert {
  id: string;
  message: string;
  batch: FoodBatch;
  timestamp: string;
}

interface LiveAlertsContextType {
  batches: FoodBatch[];
  availableBatches: FoodBatch[];
  bannerAlert: LiveAlert | null;
  recentlyAddedId: string | null;
  isConnected: boolean;
  dismissBanner: () => void;
  refreshData: () => Promise<void>;
  trackBatchId: string | null;
  setTrackBatchId: (id: string | null) => void;
}

const LiveAlertsContext = createContext<LiveAlertsContextType>({
  batches: [],
  availableBatches: [],
  bannerAlert: null,
  recentlyAddedId: null,
  isConnected: false,
  dismissBanner: () => {},
  refreshData: async () => {},
  trackBatchId: null,
  setTrackBatchId: () => {},
});

export const LiveAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<FoodBatch[]>([]);
  const [bannerAlert, setBannerAlert] = useState<LiveAlert | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [trackBatchId, setTrackBatchId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bannerTimerRef = useRef<any>(null);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.batches)) {
          setBatches(data.batches);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch batches:', err);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Connect to WebSocket with auto-reconnect
  useEffect(() => {
    let reconnectTimeout: any = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, proxy handles /ws or connect to localhost:4000
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'BATCH_CREATED') {
            const newBatch: FoodBatch = data.payload.batch;
            setBatches((prev) => [newBatch, ...prev.filter((b) => b.id !== newBatch.id)]);
            setRecentlyAddedId(newBatch.id);

            // Trigger slide-in banner alert
            if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
            setBannerAlert({
              id: newBatch.id,
              message: `New: ${newBatch.quantity} portions of ${newBatch.category} at ${newBatch.location}`,
              batch: newBatch,
              timestamp: new Date().toLocaleTimeString(),
            });

            // Auto-hide alert banner after 8 seconds
            bannerTimerRef.current = setTimeout(() => {
              setBannerAlert(null);
            }, 8000);

            // Remove card highlight after 4 seconds
            setTimeout(() => {
              setRecentlyAddedId((curr) => (curr === newBatch.id ? null : curr));
            }, 4000);
          } else if (data.type === 'BATCH_CLAIMED') {
            const claimedBatch: FoodBatch = data.payload.batch;
            setBatches((prev) =>
              prev.map((b) => (b.id === claimedBatch.id ? claimedBatch : b))
            );
          } else if (data.type === 'BATCH_EXPIRED') {
            const expiredBatch: FoodBatch = data.payload.batch;
            setBatches((prev) =>
              prev.map((b) => (b.id === expiredBatch.id ? { ...b, status: 'Expired' } : b))
            );
          } else if (data.type === 'STATE_RESET') {
            fetchBatches();
          }
        } catch (err) {
          console.warn('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchBatches]);

  const dismissBanner = () => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBannerAlert(null);
  };

  const availableBatches = batches.filter((b) => b.status === 'Available');

  return (
    <LiveAlertsContext.Provider
      value={{
        batches,
        availableBatches,
        bannerAlert,
        recentlyAddedId,
        isConnected,
        dismissBanner,
        refreshData: fetchBatches,
        trackBatchId,
        setTrackBatchId,
      }}
    >
      {children}
    </LiveAlertsContext.Provider>
  );
};

export const useLiveAlerts = () => useContext(LiveAlertsContext);
