import type { Space, Channel } from "../../types/space";
import type { Participant } from "../../types/participant";
import { generateId } from "../../utils/id";

export type SpaceRuntimeCore = {
  readonly space: Space | null;
  readonly participants: readonly Participant[];
  readonly isLoading: boolean;

  // Space CRUD
  create(name: string, description?: string): Space;
  load(spaceId: string): Promise<void>;
  rename(name: string): void;
  setDescription(description: string): void;

  // Channel management
  createChannel(name: string, description?: string): Channel;
  archiveChannel(channelId: string): void;
  renameChannel(channelId: string, name: string): void;
  getChannel(channelId: string): Channel | undefined;

  // Participant management
  addParticipant(participant: Omit<Participant, "joinedAt">): Participant;
  removeParticipant(participantId: string): void;
  updateParticipantStatus(
    participantId: string,
    status: Participant["status"],
  ): void;
  getParticipant(participantId: string): Participant | undefined;

  // Subscriptions
  subscribe(callback: () => void): () => void;
};

export class LocalSpaceRuntimeCore implements SpaceRuntimeCore {
  private _space: Space | null = null;
  private _participants: Participant[] = [];
  private _isLoading = false;
  private _subscriptions = new Set<() => void>();

  get space(): Space | null {
    return this._space;
  }

  get participants(): readonly Participant[] {
    return this._participants;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  create(name: string, description?: string): Space {
    const space: Space = {
      id: generateId(),
      name,
      description,
      channels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._space = space;
    this._notify();
    return space;
  }

  async load(spaceId: string): Promise<void> {
    this._isLoading = true;
    this._notify();

    // TODO: Load from adapter/storage
    this._isLoading = false;
    this._notify();
  }

  rename(name: string): void {
    if (!this._space) throw new Error("Space not initialized");
    this._space = {
      ...this._space,
      name,
      updatedAt: new Date(),
    };
    this._notify();
  }

  setDescription(description: string): void {
    if (!this._space) throw new Error("Space not initialized");
    this._space = {
      ...this._space,
      description,
      updatedAt: new Date(),
    };
    this._notify();
  }

  createChannel(name: string, description?: string): Channel {
    if (!this._space) throw new Error("Space not initialized");

    // Check for duplicate names
    if (this._space.channels.some((c) => c.name === name)) {
      throw new Error(`Channel "${name}" already exists`);
    }

    const channel: Channel = {
      id: generateId(),
      name,
      description,
      archived: false,
      createdAt: new Date(),
    };

    this._space = {
      ...this._space,
      channels: [...this._space.channels, channel],
      updatedAt: new Date(),
    };
    this._notify();
    return channel;
  }

  archiveChannel(channelId: string): void {
    if (!this._space) throw new Error("Space not initialized");

    const channel = this._space.channels.find((c) => c.id === channelId);
    if (!channel) throw new Error(`Channel ${channelId} not found`);

    this._space = {
      ...this._space,
      channels: this._space.channels.map((c) =>
        c.id === channelId ? { ...c, archived: true } : c,
      ),
      updatedAt: new Date(),
    };
    this._notify();
  }

  renameChannel(channelId: string, name: string): void {
    if (!this._space) throw new Error("Space not initialized");

    this._space = {
      ...this._space,
      channels: this._space.channels.map((c) =>
        c.id === channelId ? { ...c, name } : c,
      ),
      updatedAt: new Date(),
    };
    this._notify();
  }

  getChannel(channelId: string): Channel | undefined {
    return this._space?.channels.find((c) => c.id === channelId);
  }

  addParticipant(participant: Omit<Participant, "joinedAt">): Participant {
    if (!this._space) throw new Error("Space not initialized");

    const newParticipant: Participant = {
      ...participant,
      joinedAt: new Date(),
    } as Participant;

    this._participants = [...this._participants, newParticipant];
    this._notify();
    return newParticipant;
  }

  removeParticipant(participantId: string): void {
    this._participants = this._participants.filter(
      (p) => p.id !== participantId,
    );
    this._notify();
  }

  updateParticipantStatus(
    participantId: string,
    status: Participant["status"],
  ): void {
    this._participants = this._participants.map((p) =>
      p.id === participantId ? { ...p, status } : p,
    );
    this._notify();
  }

  getParticipant(participantId: string): Participant | undefined {
    return this._participants.find((p) => p.id === participantId);
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
