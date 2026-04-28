import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalSpaceRuntimeCore } from "../runtime/space-runtime-core";
import type { HumanParticipant, AgentParticipant } from "../types/participant";

describe("LocalSpaceRuntimeCore", () => {
  let runtime: LocalSpaceRuntimeCore;

  beforeEach(() => {
    runtime = new LocalSpaceRuntimeCore();
  });

  describe("create", () => {
    it("should create a new space with given name", () => {
      const space = runtime.create("My Space");
      expect(space.name).toBe("My Space");
      expect(space.id).toBeDefined();
      expect(space.channels).toHaveLength(0);
      expect(space.participants).toHaveLength(0);
    });

    it("should create space with description", () => {
      const space = runtime.create("My Space", "A test space");
      expect(space.description).toBe("A test space");
    });

    it("should initialize space state", () => {
      runtime.create("Test");
      expect(runtime.space).not.toBeNull();
      expect(runtime.space?.name).toBe("Test");
    });
  });

  describe("rename", () => {
    it("should rename the space", () => {
      runtime.create("Old Name");
      runtime.rename("New Name");
      expect(runtime.space?.name).toBe("New Name");
    });

    it("should throw if space not initialized", () => {
      expect(() => runtime.rename("New Name")).toThrow("Space not initialized");
    });
  });

  describe("channel management", () => {
    beforeEach(() => {
      runtime.create("Test Space");
    });

    it("should create a channel", () => {
      const channel = runtime.createChannel("general");
      expect(channel.name).toBe("general");
      expect(channel.archived).toBe(false);
      expect(runtime.space?.channels).toHaveLength(1);
    });

    it("should throw on duplicate channel name", () => {
      runtime.createChannel("general");
      expect(() => runtime.createChannel("general")).toThrow(
        'Channel "general" already exists',
      );
    });

    it("should archive a channel", () => {
      const channel = runtime.createChannel("general");
      runtime.archiveChannel(channel.id);
      const archived = runtime.getChannel(channel.id);
      expect(archived?.archived).toBe(true);
    });

    it("should throw when archiving non-existent channel", () => {
      expect(() => runtime.archiveChannel("non-existent")).toThrow(
        "Channel non-existent not found",
      );
    });

    it("should rename a channel", () => {
      const channel = runtime.createChannel("general");
      runtime.renameChannel(channel.id, "random");
      expect(runtime.getChannel(channel.id)?.name).toBe("random");
    });
  });

  describe("participant management", () => {
    beforeEach(() => {
      runtime.create("Test Space");
    });

    it("should add a human participant", () => {
      const participant = runtime.addParticipant({
        id: "user-1",
        displayName: "Alice",
        status: "online",
        role: "human",
      } as Omit<HumanParticipant, "joinedAt">);
      expect(participant.displayName).toBe("Alice");
      expect(participant.role).toBe("human");
      expect(runtime.participants).toHaveLength(1);
    });

    it("should add an agent participant", () => {
      const participant = runtime.addParticipant({
        id: "agent-1",
        displayName: "CodeReviewAgent",
        status: "online",
        role: "agent",
        capabilities: {
          tools: ["review"],
          inputTypes: ["code"],
        },
      } as Omit<AgentParticipant, "joinedAt">);
      expect(participant.role).toBe("agent");
      expect(runtime.participants).toHaveLength(1);
    });

    it("should remove a participant", () => {
      runtime.addParticipant({
        id: "user-1",
        displayName: "Alice",
        status: "online",
        role: "human",
      } as Omit<HumanParticipant, "joinedAt">);
      runtime.removeParticipant("user-1");
      expect(runtime.participants).toHaveLength(0);
    });

    it("should update participant status", () => {
      runtime.addParticipant({
        id: "user-1",
        displayName: "Alice",
        status: "online",
        role: "human",
      } as Omit<HumanParticipant, "joinedAt">);
      runtime.updateParticipantStatus("user-1", "away");
      expect(runtime.getParticipant("user-1")?.status).toBe("away");
    });

    it("should throw when adding participant to uninitialized space", () => {
      const uninitializedRuntime = new LocalSpaceRuntimeCore();
      expect(() =>
        uninitializedRuntime.addParticipant({
          id: "user-1",
          displayName: "Alice",
          status: "online",
          role: "human",
        } as Omit<HumanParticipant, "joinedAt">),
      ).toThrow("Space not initialized");
    });
  });

  describe("subscriptions", () => {
    it("should notify subscribers on changes", () => {
      const callback = vi.fn();
      runtime.subscribe(callback);
      runtime.create("Test");
      expect(callback).toHaveBeenCalled();
    });

    it("should allow unsubscribing", () => {
      const callback = vi.fn();
      const unsubscribe = runtime.subscribe(callback);
      unsubscribe();
      runtime.create("Test");
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
