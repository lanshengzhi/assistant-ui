/** SSE Presence Transport */

import type { PresenceEvent, PresenceTransportEvent } from "./presence-events";

export type SSEPresenceTransportOptions = {
  /** SSE endpoint URL */
  endpoint: string;
  /** Space ID */
  spaceId: string;
  /** Auth token */
  authToken?: string;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Max reconnect attempts (default: 10) */
  maxReconnectAttempts?: number;
};

export type SSEPresenceTransport = {
  /** Connect to SSE endpoint */
  connect(): void;
  /** Disconnect from SSE endpoint */
  disconnect(): void;
  /** Send presence update */
  sendUpdate(event: Omit<PresenceEvent, "type">): Promise<void>;
  /** Subscribe to presence events */
  onEvent(callback: (event: PresenceTransportEvent) => void): () => void;
  /** Subscribe to connection state changes */
  onConnectionChange(callback: (connected: boolean) => void): () => void;
};

export class DefaultSSEPresenceTransport implements SSEPresenceTransport {
  private _options: Required<Omit<SSEPresenceTransportOptions, "authToken">> &
    Pick<SSEPresenceTransportOptions, "authToken">;
  private _eventSource: EventSource | null = null;
  private _eventCallbacks = new Set<(event: PresenceTransportEvent) => void>();
  private _connectionCallbacks = new Set<(connected: boolean) => void>();
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SSEPresenceTransportOptions) {
    this._options = {
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  connect(): void {
    if (this._eventSource) return;

    const url = new URL(this._options.endpoint);
    url.searchParams.set("spaceId", this._options.spaceId);
    if (this._options.authToken) {
      url.searchParams.set("token", this._options.authToken);
    }

    this._eventSource = new EventSource(url.toString());

    this._eventSource.onopen = () => {
      this._reconnectAttempts = 0;
      this._notifyConnectionChange(true);
    };

    this._eventSource.onmessage = (event) => {
      try {
        const data: PresenceTransportEvent = JSON.parse(event.data);
        this._notifyEvent(data);
      } catch {
        // Ignore malformed events
      }
    };

    this._eventSource.onerror = () => {
      this._notifyConnectionChange(false);
      this._scheduleReconnect();
    };
  }

  disconnect(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }

    this._notifyConnectionChange(false);
  }

  async sendUpdate(event: Omit<PresenceEvent, "type">): Promise<void> {
    const fullEvent: PresenceEvent = {
      type: "presence-update",
      ...event,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this._options.authToken) {
      headers.Authorization = `Bearer ${this._options.authToken}`;
    }

    const response = await fetch(`${this._options.endpoint}/update`, {
      method: "POST",
      headers,
      body: JSON.stringify(fullEvent),
    });

    if (!response.ok) {
      throw new Error(`Failed to send presence update: ${response.status}`);
    }
  }

  onEvent(callback: (event: PresenceTransportEvent) => void): () => void {
    this._eventCallbacks.add(callback);
    return () => {
      this._eventCallbacks.delete(callback);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this._connectionCallbacks.add(callback);
    return () => {
      this._connectionCallbacks.delete(callback);
    };
  }

  private _scheduleReconnect(): void {
    if (this._reconnectAttempts >= this._options.maxReconnectAttempts) {
      console.warn("Max SSE reconnection attempts reached");
      return;
    }

    this._reconnectAttempts++;
    const delay =
      this._options.reconnectDelay * 2 ** (this._reconnectAttempts - 1);

    this._reconnectTimer = setTimeout(
      () => {
        this.connect();
      },
      Math.min(delay, 30000),
    ); // Cap at 30 seconds
  }

  private _notifyEvent(event: PresenceTransportEvent): void {
    for (const callback of this._eventCallbacks) {
      callback(event);
    }
  }

  private _notifyConnectionChange(connected: boolean): void {
    for (const callback of this._connectionCallbacks) {
      callback(connected);
    }
  }
}
