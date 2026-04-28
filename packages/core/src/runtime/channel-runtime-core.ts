import type { Channel } from "../types/space";
import { generateId } from "../utils/id";

export type ChannelRuntimeCore = {
  readonly channel: Channel | null;
  readonly threadIds: readonly string[];
  readonly isLoading: boolean;

  // Channel operations
  load(channelId: string): Promise<void>;
  archive(): void;
  rename(name: string): void;
  setDescription(description: string): void;

  // Thread management
  createThread(title?: string): string;
  getThread(threadId: string): { id: string; title?: string } | undefined;
  selectThread(threadId: string): void;

  // Subscriptions
  subscribe(callback: () => void): () => void;
};

export class LocalChannelRuntimeCore implements ChannelRuntimeCore {
  private _channel: Channel | null = null;
  private _threadIds: string[] = [];
  private _isLoading = false;
  private _subscriptions = new Set<() => void>();

  get channel(): Channel | null {
    return this._channel;
  }

  get threadIds(): readonly string[] {
    return this._threadIds;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  async load(_channelId: string): Promise<void> {
    this._isLoading = true;
    this._notify();

    // TODO: Load from adapter/storage
    this._isLoading = false;
    this._notify();
  }

  archive(): void {
    if (!this._channel) throw new Error("Channel not initialized");
    this._channel = {
      ...this._channel,
      archived: true,
    };
    this._notify();
  }

  rename(name: string): void {
    if (!this._channel) throw new Error("Channel not initialized");
    this._channel = {
      ...this._channel,
      name,
    };
    this._notify();
  }

  setDescription(description: string): void {
    if (!this._channel) throw new Error("Channel not initialized");
    this._channel = {
      ...this._channel,
      description,
    };
    this._notify();
  }

  createThread(_title?: string): string {
    if (!this._channel) throw new Error("Channel not initialized");

    const threadId = generateId();
    this._threadIds = [...this._threadIds, threadId];
    this._notify();
    return threadId;
  }

  getThread(threadId: string): { id: string; title?: string } | undefined {
    if (!this._threadIds.includes(threadId)) return undefined;
    return { id: threadId };
  }

  selectThread(threadId: string): void {
    if (!this._threadIds.includes(threadId)) {
      throw new Error(`Thread ${threadId} not found in channel`);
    }
    this._notify();
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
