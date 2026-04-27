import type { Participant } from "../../types/participant";

export type ParticipantState = {
  readonly participant: Participant | null;
  readonly isLoading: boolean;
};

export type ParticipantMethods = {
  /**
   * Get the current state of the participant.
   */
  getState(): ParticipantState;
  /**
   * Update participant status.
   */
  setStatus(status: Participant["status"]): void;
  /**
   * Update display name.
   */
  setDisplayName(name: string): void;
  /**
   * Update avatar.
   */
  setAvatar(avatar: string): void;
};

export type ParticipantMeta = {
  source: "space" | "thread";
  query: { type: "participant"; participantId: string };
};

export type ParticipantEvents = {
  "participant.statusChanged": {
    participantId: string;
    status: Participant["status"];
  };
  "participant.joined": { participantId: string; spaceId: string };
  "participant.left": { participantId: string; spaceId: string };
};

export type ParticipantClientSchema = {
  methods: ParticipantMethods;
  meta: ParticipantMeta;
  events: ParticipantEvents;
};
