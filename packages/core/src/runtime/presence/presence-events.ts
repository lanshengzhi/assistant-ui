/** Presence tracking types */

export type PresenceStatus = "online" | "away" | "offline" | "busy";

export type PresenceEvent = {
  type: "presence-update";
  participantId: string;
  status: PresenceStatus;
  timestamp: number;
};

export type PresenceSyncEvent = {
  type: "presence-sync";
  participants: Array<{
    participantId: string;
    status: PresenceStatus;
    lastSeen: number;
  }>;
};

export type PresenceTransportEvent = PresenceEvent | PresenceSyncEvent;
