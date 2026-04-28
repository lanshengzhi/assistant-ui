import { describe, it, expect, beforeEach, vi } from "vitest";
import { MultiParticipantMessageRepository } from "../runtime/utils/multi-participant-message-repository";
import type { SpaceThreadMessage } from "../types/message";

describe("MultiParticipantMessageRepository", () => {
  let repository: MultiParticipantMessageRepository;

  const createMessage = (
    id: string,
    participantId: string,
    overrides = {},
  ): SpaceThreadMessage => ({
    id,
    participantId,
    content: [{ type: "text", text: "Test" }],
    status: { type: "complete", reason: "stop" },
    createdAt: new Date(),
    metadata: {
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      steps: [],
      custom: {},
    },
    ...overrides,
  });

  beforeEach(() => {
    repository = new MultiParticipantMessageRepository();
  });

  describe("addOrUpdateMessage", () => {
    it("should add a message", () => {
      const message = createMessage("msg-1", "alice");
      repository.addOrUpdateMessage(null, message);
      expect(repository.getMessages()).toHaveLength(1);
    });

    it("should track parent-child relationship", () => {
      const parent = createMessage("msg-1", "alice");
      const child = createMessage("msg-2", "bob", { parentId: "msg-1" });

      repository.addOrUpdateMessage(null, parent);
      repository.addOrUpdateMessage("msg-1", child);

      expect(repository.getChildren("msg-1")).toHaveLength(1);
      expect(repository.getChildren("msg-1")[0].id).toBe("msg-2");
    });

    it("should update existing message", () => {
      const message = createMessage("msg-1", "alice");
      repository.addOrUpdateMessage(null, message);

      const updated = createMessage("msg-1", "alice", {
        content: [{ type: "text", text: "Updated" }],
      });
      repository.addOrUpdateMessage(null, updated);

      expect(repository.getMessages()).toHaveLength(1);
      expect(repository.getMessage("msg-1").message.content[0].text).toBe(
        "Updated",
      );
    });
  });

  describe("getMessages", () => {
    it("should return messages in chronological order", () => {
      const msg1 = createMessage("msg-1", "alice", {
        createdAt: new Date("2024-01-01"),
      });
      const msg2 = createMessage("msg-2", "bob", {
        createdAt: new Date("2024-01-02"),
      });

      repository.addOrUpdateMessage(null, msg2);
      repository.addOrUpdateMessage(null, msg1);

      const messages = repository.getMessages();
      expect(messages[0].id).toBe("msg-1");
      expect(messages[1].id).toBe("msg-2");
    });
  });

  describe("participant attribution", () => {
    it("should get messages by participant", () => {
      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));
      repository.addOrUpdateMessage(null, createMessage("msg-2", "bob"));
      repository.addOrUpdateMessage(null, createMessage("msg-3", "alice"));

      const aliceMessages = repository.getMessagesByParticipant("alice");
      expect(aliceMessages).toHaveLength(2);
      expect(aliceMessages.map((m) => m.id)).toEqual(["msg-1", "msg-3"]);
    });

    it("should check if participant has messages", () => {
      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));
      expect(repository.hasParticipant("alice")).toBe(true);
      expect(repository.hasParticipant("unknown")).toBe(false);
    });
  });

  describe("threading", () => {
    it("should get messages from branch", () => {
      const msg1 = createMessage("msg-1", "alice");
      const msg2 = createMessage("msg-2", "bob");
      const msg3 = createMessage("msg-3", "alice");

      repository.addOrUpdateMessage(null, msg1);
      repository.addOrUpdateMessage("msg-1", msg2);
      repository.addOrUpdateMessage("msg-2", msg3);

      const branch = repository.getMessagesFromBranch("msg-3");
      expect(branch).toHaveLength(3);
      expect(branch.map((m) => m.id)).toEqual(["msg-1", "msg-2", "msg-3"]);
    });
  });

  describe("export/import", () => {
    it("should export and import state", () => {
      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));
      repository.addOrUpdateMessage("msg-1", createMessage("msg-2", "bob"));

      const exported = repository.export();
      expect(exported.messages).toHaveLength(2);

      const newRepo = new MultiParticipantMessageRepository();
      newRepo.import(exported);
      expect(newRepo.getMessages()).toHaveLength(2);
    });
  });

  describe("subscriptions", () => {
    it("should notify subscribers", () => {
      const callback = vi.fn();
      repository.subscribe(callback);

      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty repository", () => {
      expect(repository.getMessages()).toHaveLength(0);
      expect(repository.getChildren("non-existent")).toHaveLength(0);
      expect(repository.headId).toBeNull();
    });

    it("should throw for non-existent message", () => {
      expect(() => repository.getMessage("non-existent")).toThrow(
        "Message non-existent not found",
      );
    });
  });

  describe("concurrent safety", () => {
    it("should handle reentrant updates via subscriptions", () => {
      let callCount = 0;
      repository.subscribe(() => {
        callCount++;
        // Simulate reentrant call from subscription handler
        if (callCount === 1) {
          repository.addOrUpdateMessage(null, createMessage("msg-2", "bob"));
        }
      });

      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));

      // Both messages should be present despite reentrant call
      expect(repository.getMessages()).toHaveLength(2);
      expect(callCount).toBe(2); // Two notifications: msg-1 and msg-2
    });

    it("should queue multiple reentrant updates", () => {
      const ids: string[] = [];
      repository.subscribe(() => {
        const messages = repository.getMessages();
        if (messages.length > 0) {
          const lastId = messages[messages.length - 1].id;
          if (!ids.includes(lastId)) {
            ids.push(lastId);
            // Trigger another reentrant call
            if (ids.length < 3) {
              repository.addOrUpdateMessage(
                null,
                createMessage(`msg-${ids.length + 1}`, "charlie"),
              );
            }
          }
        }
      });

      repository.addOrUpdateMessage(null, createMessage("msg-1", "alice"));

      expect(repository.getMessages()).toHaveLength(3);
      expect(ids).toEqual(["msg-1", "msg-2", "msg-3"]);
    });
  });
});
