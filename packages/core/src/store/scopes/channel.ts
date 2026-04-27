import type { Channel } from "../../types/space";

export type ChannelState = {
  readonly channel: Channel | null;
  readonly threadIds: readonly string[];
  readonly isLoading: boolean;
};

export type ChannelMethods = {
  /**
   * Get the current state of the channel.
   */
  getState(): ChannelState;
  /**
   * Create a new thread in this channel.
   */
  createThread(title?: string): void;
  /**
   * Archive the channel.
   */
  archive(): void;
  /**
   * Rename the channel.
   */
  rename(name: string): void;
  /**
   * Set channel description.
   */
  setDescription(description: string): void;
  /**
   * Select a thread by ID.
   */
  selectThread(threadId: string): void;
};

export type ChannelMeta = {
  source: "space";
  query: { type: "channel"; channelId: string };
};

export type ChannelEvents = {
  "channel.loaded": { channelId: string };
  "channel.threadCreated": { channelId: string; threadId: string };
  "channel.threadSelected": { channelId: string; threadId: string };
  "channel.archived": { channelId: string };
};

export type ChannelClientSchema = {
  methods: ChannelMethods;
  meta: ChannelMeta;
  events: ChannelEvents;
};
