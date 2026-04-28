import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PresenceManager } from "../runtime/presence/presence-manager";

describe("PresenceManager", () => {
  let manager: PresenceManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    manager = new PresenceManager({
      awayThreshold: 5 * 60 * 1000, // 5 minutes
      offlineThreshold: 30 * 60 * 1000, // 30 minutes
    });
  });

  afterEach(() => {
    manager.dispose();
    vi.useRealTimers();
  });

  describe("idle timer lifecycle", () => {
    it("should start idle timer when participant is added", () => {
      manager.setPresence("user-1", "online");
      // Timer should be running (advance by 30s to trigger check)
      vi.advanceTimersByTime(30000);
      // Participant is still online since 30s < 5min away threshold
      expect(manager.getPresence("user-1").status).toBe("online");
    });

    it("should stop idle timer when all participants are removed", () => {
      manager.setPresence("user-1", "online");
      manager.removeParticipant("user-1");

      // Advance time - no timer should be running
      vi.advanceTimersByTime(30000);
      // No errors should occur
      expect(manager.getOnlineParticipants()).toHaveLength(0);
    });

    it("should stop idle timer when sync receives empty participants", () => {
      manager.setPresence("user-1", "online");
      manager.sync([]);

      // Timer should be stopped - advancing time shouldn't cause errors
      vi.advanceTimersByTime(30000);
      // Participant remains since sync([]) doesn't clear existing
      expect(manager.getPresence("user-1").status).toBe("online");
    });

    it("should transition online participant to away after threshold", () => {
      const startTime = Date.now();
      manager.setPresence("user-1", "online");

      // Advance past away threshold (5 minutes) + timer interval
      vi.setSystemTime(startTime + 5 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      expect(manager.getPresence("user-1").status).toBe("away");
    });

    it("should transition away participant to offline after threshold", () => {
      const startTime = Date.now();
      manager.setPresence("user-1", "online");

      // First transition to away
      vi.setSystemTime(startTime + 5 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      expect(manager.getPresence("user-1").status).toBe("away");

      // Then transition to offline
      vi.setSystemTime(startTime + 30 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(25 * 60 * 1000);

      expect(manager.getPresence("user-1").status).toBe("offline");
    });

    it("should not leak timer after dispose", () => {
      manager.setPresence("user-1", "online");
      manager.dispose();

      // After dispose, timer should be cleared
      // Advancing timers should not cause errors
      vi.advanceTimersByTime(30 * 60 * 1000);
      expect(manager.getPresence("user-1").status).toBe("online"); // No updates processed
    });

    it("should restart timer when applying event after all removed", () => {
      const startTime = Date.now();
      manager.setPresence("user-1", "online");
      manager.removeParticipant("user-1");

      // Timer should be stopped
      vi.advanceTimersByTime(30000);

      // Add participant back via applyEvent
      manager.applyEvent({
        type: "presence-update",
        participantId: "user-2",
        status: "online",
        timestamp: startTime,
      });

      // Timer should be running again
      vi.setSystemTime(startTime + 5 * 60 * 1000 + 1000);
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      expect(manager.getPresence("user-2").status).toBe("away");
    });
  });

  describe("presence updates", () => {
    it("should update own presence", () => {
      manager.updateOwnPresence("user-1");
      expect(manager.getPresence("user-1").status).toBe("online");
    });

    it("should handle visibility change", () => {
      manager.handleVisibilityChange("user-1", true);
      expect(manager.getPresence("user-1").status).toBe("online");

      manager.handleVisibilityChange("user-1", false);
      expect(manager.getPresence("user-1").status).toBe("away");
    });

    it("should get online participants", () => {
      manager.setPresence("user-1", "online");
      manager.setPresence("user-2", "busy");
      manager.setPresence("user-3", "offline");

      const online = manager.getOnlineParticipants();
      expect(online).toContain("user-1");
      expect(online).toContain("user-2");
      expect(online).not.toContain("user-3");
    });

    it("should notify subscribers on changes", () => {
      const callback = vi.fn();
      manager.subscribe(callback);

      manager.setPresence("user-1", "online");
      expect(callback).toHaveBeenCalled();
    });
  });
});
