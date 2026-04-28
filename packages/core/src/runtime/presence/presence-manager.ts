/** Presence Manager - tracks participant status */

import type { PresenceStatus, PresenceEvent } from "./presence-events";

export type PresenceManagerOptions = {
  /** Idle threshold in ms before status changes to 'away' (default: 5 minutes) */
  awayThreshold?: number;
  /** Offline threshold in ms (default: 30 minutes) */
  offlineThreshold?: number;
};

export type PresenceState = {
  status: PresenceStatus;
  lastSeen: number;
};

export class PresenceManager {
  private _options: Required<PresenceManagerOptions>;
  private _presence = new Map<string, PresenceState>();
  private _subscriptions = new Set<() => void>();
  private _idleTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: PresenceManagerOptions = {}) {
    this._options = {
      awayThreshold: 5 * 60 * 1000, // 5 minutes
      offlineThreshold: 30 * 60 * 1000, // 30 minutes
      ...options,
    };
  }

  /**
   * Set presence for a participant.
   */
  setPresence(participantId: string, status: PresenceStatus): void {
    this._presence.set(participantId, {
      status,
      lastSeen: Date.now(),
    });
    this._ensureIdleTimer();
    this._notify();
  }

  /**
   * Get presence for a participant.
   */
  getPresence(participantId: string): PresenceState {
    return (
      this._presence.get(participantId) || {
        status: "offline",
        lastSeen: 0,
      }
    );
  }

  /**
   * Get all online participants.
   */
  getOnlineParticipants(): string[] {
    return Array.from(this._presence.entries())
      .filter(
        ([_, state]) => state.status === "online" || state.status === "busy",
      )
      .map(([id]) => id);
  }

  /**
   * Remove a participant.
   */
  removeParticipant(participantId: string): void {
    this._presence.delete(participantId);
    if (this._presence.size === 0) {
      this._stopIdleTimer();
    }
    this._notify();
  }

  /**
   * Update own presence based on activity.
   */
  updateOwnPresence(participantId: string): void {
    this.setPresence(participantId, "online");
  }

  /**
   * Handle tab visibility change.
   */
  handleVisibilityChange(participantId: string, isVisible: boolean): void {
    if (isVisible) {
      this.setPresence(participantId, "online");
    } else {
      this.setPresence(participantId, "away");
    }
  }

  /**
   * Apply an external presence event.
   */
  applyEvent(event: PresenceEvent): void {
    this._presence.set(event.participantId, {
      status: event.status,
      lastSeen: event.timestamp,
    });
    this._ensureIdleTimer();
    this._notify();
  }

  /**
   * Sync presence state from server.
   */
  sync(
    participants: Array<{
      participantId: string;
      status: PresenceStatus;
      lastSeen: number;
    }>,
  ): void {
    for (const p of participants) {
      this._presence.set(p.participantId, {
        status: p.status,
        lastSeen: p.lastSeen,
      });
    }
    if (participants.length > 0) {
      this._ensureIdleTimer();
    } else {
      this._stopIdleTimer();
    }
    this._notify();
  }

  subscribe(callback: () => void): () => void {
    this._subscriptions.add(callback);
    return () => {
      this._subscriptions.delete(callback);
    };
  }

  dispose(): void {
    this._stopIdleTimer();
  }

  private _ensureIdleTimer(): void {
    if (!this._idleTimer && this._presence.size > 0) {
      this._startIdleTimer();
    }
  }

  private _stopIdleTimer(): void {
    if (this._idleTimer) {
      clearInterval(this._idleTimer);
      this._idleTimer = null;
    }
  }

  private _startIdleTimer(): void {
    this._idleTimer = setInterval(() => {
      if (this._presence.size === 0) {
        this._stopIdleTimer();
        return;
      }

      const now = Date.now();
      let hasChanges = false;

      for (const [participantId, state] of this._presence) {
        if (
          state.status === "online" ||
          state.status === "busy" ||
          state.status === "away"
        ) {
          const idleTime = now - state.lastSeen;

          if (idleTime > this._options.offlineThreshold) {
            this._presence.set(participantId, {
              ...state,
              status: "offline",
            });
            hasChanges = true;
          } else if (
            idleTime > this._options.awayThreshold &&
            state.status !== "away"
          ) {
            this._presence.set(participantId, {
              ...state,
              status: "away",
            });
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        this._notify();
      }
    }, 30000); // Check every 30 seconds
  }

  private _notify(): void {
    for (const callback of this._subscriptions) {
      callback();
    }
  }
}
