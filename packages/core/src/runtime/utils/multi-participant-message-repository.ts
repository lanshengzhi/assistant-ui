import type { SpaceThreadMessage } from "../../types/message";
import { generateId, generateOptimisticId } from "../../utils/id";

export type MultiParticipantMessageRepositoryItem = {
  message: SpaceThreadMessage;
  parentId: string | null;
};

export type ExportedMultiParticipantMessageRepository = {
  headId?: string | null;
  messages: MultiParticipantMessageRepositoryItem[];
};

export type MultiParticipantMessageRepositoryOptions = {
  /** Validate that a participant ID exists. Throws if invalid. */
  validateParticipant?: (participantId: string) => boolean;
};

export class MultiParticipantMessageRepository {
  private _messages = new Map<string, SpaceThreadMessage>();
  private _parentMap = new Map<string, string | null>();
  private _childrenMap = new Map<string, Set<string>>();
  private _headId: string | null = null;
  private _subscriptions = new Set<() => void>();
  private _validateParticipant?: (participantId: string) => boolean;

  constructor(options: MultiParticipantMessageRepositoryOptions = {}) {
    this._validateParticipant = options.validateParticipant;
  }

  /**
   * Add or update a message in the repository.
   * @param parentId The parent message ID (for threading)
   * @param message The message to add/update
   * @throws Error if participant validation fails
   */
  addOrUpdateMessage(
    parentId: string | null,
    message: SpaceThreadMessage,
  ): void {
    // Validate participant if validator is configured
    if (this._validateParticipant) {
      if (!this._validateParticipant(message.participantId)) {
        throw new Error(
          `Invalid participant ID: ${message.participantId}. Message cannot be added to repository.`,
        );
      }
    }

    const existing = this._messages.get(message.id);

    // Store message
    this._messages.set(message.id, message);

    // Store parent relationship
    this._parentMap.set(message.id, parentId);

    // Update children map
    if (parentId !== null) {
      const children = this._childrenMap.get(parentId) || new Set();
      children.add(message.id);
      this._childrenMap.set(parentId, children);
    }

    // Set head to the new message
    if (!existing) {
      this._headId = message.id;
    }

    this._notify();
  }

  /**
   * Get a message by ID.
   */
  getMessage(messageId: string): {
    message: SpaceThreadMessage;
    parentId: string | null;
  } {
    const message = this._messages.get(messageId);
    if (!message) throw new Error(`Message ${messageId} not found`);
    return {
      message,
      parentId: this._parentMap.get(messageId) ?? null,
    };
  }

  /**
   * Get all messages in chronological order.
   */
  getMessages(): readonly SpaceThreadMessage[] {
    return Array.from(this._messages.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  /**
   * Get messages for a specific thread branch.
   */
  getMessagesFromBranch(headId: string): readonly SpaceThreadMessage[] {
    const result: SpaceThreadMessage[] = [];
    let currentId: string | null = headId;

    while (currentId !== null) {
      const message = this._messages.get(currentId);
      if (!message) break;
      result.unshift(message);
      currentId = this._parentMap.get(currentId) ?? null;
    }

    return result;
  }

  /**
   * Get child messages (replies) for a message.
   */
  getChildren(messageId: string): readonly SpaceThreadMessage[] {
    const childrenIds = this._childrenMap.get(messageId);
    if (!childrenIds) return [];

    return Array.from(childrenIds)
      .map((id) => this._messages.get(id))
      .filter((m): m is SpaceThreadMessage => m !== undefined)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get the current head message ID.
   */
  get headId(): string | null {
    return this._headId;
  }

  /**
   * Set the head message ID.
   */
  resetHead(messageId: string | null): void {
    this._headId = messageId;
    this._notify();
  }

  /**
   * Get all messages by a participant.
   */
  getMessagesByParticipant(
    participantId: string,
  ): readonly SpaceThreadMessage[] {
    return this.getMessages().filter((m) => m.participantId === participantId);
  }

  /**
   * Export the repository state.
   */
  export(): ExportedMultiParticipantMessageRepository {
    return {
      headId: this._headId,
      messages: Array.from(this._messages.entries()).map(([id, message]) => ({
        message,
        parentId: this._parentMap.get(id) ?? null,
      })),
    };
  }

  /**
   * Import repository state.
   */
  import(data: ExportedMultiParticipantMessageRepository): void {
    this._messages.clear();
    this._parentMap.clear();
    this._childrenMap.clear();

    for (const item of data.messages) {
      this._messages.set(item.message.id, item.message);
      this._parentMap.set(item.message.id, item.parentId);

      if (item.parentId !== null) {
        const children = this._childrenMap.get(item.parentId) || new Set();
        children.add(item.message.id);
        this._childrenMap.set(item.parentId, children);
      }
    }

    this._headId = data.headId ?? null;
    this._notify();
  }

  /**
   * Check if a participant exists in messages.
   */
  hasParticipant(participantId: string): boolean {
    return Array.from(this._messages.values()).some(
      (m) => m.participantId === participantId,
    );
  }

  /**
   * Subscribe to repository changes.
   */
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
