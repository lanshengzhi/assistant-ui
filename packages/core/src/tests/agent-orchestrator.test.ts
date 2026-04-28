import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgentOrchestrator } from "../runtime/agent/agent-orchestrator";
import type { AgentInvoker } from "../runtime/agent/agent-invoker";

describe("AgentOrchestrator", () => {
  let orchestrator: AgentOrchestrator;
  let mockInvoker: AgentInvoker;
  let invokeCalls: Array<{ agentId: string; request: unknown }>;

  beforeEach(() => {
    invokeCalls = [];
    mockInvoker = {
      invoke: vi.fn(async (agentId, request) => {
        invokeCalls.push({ agentId, request });
      }),
      cancel: vi.fn(),
      cancelAll: vi.fn(),
    } as unknown as AgentInvoker;

    orchestrator = new AgentOrchestrator({
      invoker: mockInvoker,
      verifyParticipant: (id) => ["AgentA", "AgentB", "AgentC"].includes(id),
      maxDepth: 5,
      maxBreadth: 3,
      maxInvocationsPerMinute: 3,
    });
  });

  describe("happy path", () => {
    it("should invoke mentioned agent", async () => {
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA hello",
      );
      expect(mockInvoker.invoke).toHaveBeenCalledWith(
        "AgentA",
        expect.objectContaining({
          threadId: "thread-1",
          mentionedBy: "user",
        }),
      );
    });

    it("should invoke multiple mentioned agents", async () => {
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA and @AgentB help",
      );
      expect(mockInvoker.invoke).toHaveBeenCalledTimes(2);
      expect(invokeCalls.map((c) => c.agentId).sort()).toEqual([
        "AgentA",
        "AgentB",
      ]);
    });

    it("should handle chain of 3 agents", async () => {
      // First invocation
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA task",
      );
      expect(orchestrator.getDepth("thread-1")).toBe(0); // Depth resets after completion

      // Second invocation triggered by AgentA's response
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentA",
        "@AgentB next",
      );
      expect(orchestrator.getDepth("thread-1")).toBe(0);

      // Third invocation
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentB",
        "@AgentC done",
      );
      expect(invokeCalls.map((c) => c.agentId)).toEqual([
        "AgentA",
        "AgentB",
        "AgentC",
      ]);
    });
  });

  describe("depth limit", () => {
    it("should stop at max depth", async () => {
      // Simulate reaching max depth by calling multiple times
      for (let i = 0; i < 5; i++) {
        await orchestrator.handleAgentResponse(
          "thread-1",
          `Agent${i}`,
          "@AgentB task",
        );
      }

      // Sixth invocation should be blocked
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await orchestrator.handleAgentResponse(
        "thread-1",
        "Agent5",
        "@AgentB task",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Maximum agent invocation depth"),
      );
      consoleSpy.mockRestore();
    });

    it("should block circular references", async () => {
      // A -> B -> A should be blocked by depth
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA task",
      );
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentA",
        "@AgentB task",
      );
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentB",
        "@AgentA task",
      );
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentA",
        "@AgentB task",
      );
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentB",
        "@AgentA task",
      );

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await orchestrator.handleAgentResponse(
        "thread-1",
        "AgentA",
        "@AgentB task",
      );
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("breadth limit", () => {
    it("should only process up to maxBreadth mentions", async () => {
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA @AgentB @AgentC @AgentA",
      );
      // maxBreadth is 3, so only 3 unique agents should be invoked
      expect(mockInvoker.invoke).toHaveBeenCalledTimes(3);
    });
  });

  describe("rate limiting", () => {
    it("should limit invocations per minute", async () => {
      // maxInvocationsPerMinute is 3
      await orchestrator.handleAgentResponse("thread-1", "user", "@AgentA 1");
      await orchestrator.handleAgentResponse("thread-1", "user", "@AgentA 2");
      await orchestrator.handleAgentResponse("thread-1", "user", "@AgentA 3");

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await orchestrator.handleAgentResponse("thread-1", "user", "@AgentA 4");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Rate limit exceeded"),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("should abort chain on error", async () => {
      mockInvoker.invoke = vi.fn().mockRejectedValue(new Error("Agent failed"));

      await expect(
        orchestrator.handleAgentResponse("thread-1", "user", "@AgentA task"),
      ).rejects.toThrow("Agent failed");
    });
  });

  describe("depth tracking", () => {
    it("should reset depth", () => {
      orchestrator.resetDepth("thread-1");
      expect(orchestrator.getDepth("thread-1")).toBe(0);
    });

    it("should track depth across invocations", async () => {
      await orchestrator.handleAgentResponse(
        "thread-1",
        "user",
        "@AgentA task",
      );
      // Depth resets after handleAgentResponse completes
      expect(orchestrator.getDepth("thread-1")).toBe(0);
    });
  });
});
