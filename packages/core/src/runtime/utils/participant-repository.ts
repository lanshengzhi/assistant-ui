import type { Participant, ParticipantStatus } from "../../types/participant";

export type ParticipantRepository = {
  readonly participants: readonly Participant[];

  // CRUD operations
  add(participant: Participant): void;
  remove(participantId: string): void;
  update(
    participantId: string,
    updates: Partial<Omit<Participant, "id">>,
  ): void;
  get(participantId: string): Participant | undefined;
  getByRole(role: Participant["role"]): readonly Participant[];

  // Status management
  setStatus(participantId: string, status: ParticipantStatus): void;
  getOnlineParticipants(): readonly Participant[];

  // Subscriptions
  subscribe(callback: () => void): () => void;
};

export class InMemoryParticipantRepository implements ParticipantRepository {
  private _participants = new Map<string, Participant>();
  private _subscriptions = new Set<() => void>();

  get participants(): readonly Participant[] {
    return Array.from(this._participants.values());
  }

  add(participant: Participant): void {
    this._participants.set(participant.id, participant);
    this._notify();
  }

  remove(participantId: string): void {
    this._participants.delete(participantId);
    this._notify();
  }

  update(
    participantId: string,
    updates: Partial<Omit<Participant, "id">>,
  ): void {
    const participant = this._participants.get(participantId);
    if (!participant) throw new Error(`Participant ${participantId} not found`);

    this._participants.set(participantId, {
      ...participant,
      ...updates,
    });
    this._notify();
  }

  get(participantId: string): Participant | undefined {
    return this._participants.get(participantId);
  }

  getByRole(role: Participant["role"]): readonly Participant[] {
    return this.participants.filter((p) => p.role === role);
  }

  setStatus(participantId: string, status: ParticipantStatus): void {
    const participant = this._participants.get(participantId);
    if (!participant) throw new Error(`Participant ${participantId} not found`);

    this._participants.set(participantId, {
      ...participant,
      status,
    });
    this._notify();
  }

  getOnlineParticipants(): readonly Participant[] {
    return this.participants.filter(
      (p) => p.status === "online" || p.status === "busy",
    );
  }

  subscribe(callback: () => void): () => void {
    this._subscriptions.add(callback);
    return () => {
      this._subscriptions.delete(callback);
    };
  }

  private _notify(): void {
    for (const callback of this._subscriptions) {
      callback();
    }
  }
}
