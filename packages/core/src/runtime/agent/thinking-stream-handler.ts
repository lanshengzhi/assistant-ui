/** Agent Thinking Stream Handler */

import type { ThinkingStep } from "../../types/participant";

export type ThinkingStreamHandlerOptions = {
  /** Maximum number of thinking steps to keep (default: 50) */
  maxSteps?: number;
  /** Called when thinking steps change */
  onStepsChange?: (
    participantId: string,
    steps: readonly ThinkingStep[],
  ) => void;
  /** Called when agent status changes */
  onStatusChange?: (
    participantId: string,
    status: "online" | "busy" | "offline",
  ) => void;
};

export class ThinkingStreamHandler {
  private _options: Required<Pick<ThinkingStreamHandlerOptions, "maxSteps">> &
    Omit<ThinkingStreamHandlerOptions, "maxSteps">;
  private _thinkingSteps = new Map<string, ThinkingStep[]>();
  private _agentStatus = new Map<string, "online" | "busy" | "offline">();

  constructor(options: ThinkingStreamHandlerOptions = {}) {
    this._options = {
      maxSteps: 50,
      ...options,
    };
  }

  /**
   * Start tracking thinking for an agent.
   */
  startThinking(participantId: string): void {
    this._agentStatus.set(participantId, "busy");
    this._options.onStatusChange?.(participantId, "busy");
  }

  /**
   * Add a thinking step for an agent.
   */
  addStep(
    participantId: string,
    step: Omit<ThinkingStep, "id"> & { id?: string },
  ): void {
    const steps = this._thinkingSteps.get(participantId) || [];
    const newStep: ThinkingStep = {
      id: step.id || this._generateId(),
      message: step.message,
      timestamp: step.timestamp || Date.now(),
    };

    steps.push(newStep);

    // Trim to max steps
    if (steps.length > this._options.maxSteps) {
      steps.splice(0, steps.length - this._options.maxSteps);
    }

    this._thinkingSteps.set(participantId, steps);
    this._options.onStepsChange?.(participantId, [...steps]);
  }

  /**
   * Complete thinking for an agent.
   */
  completeThinking(participantId: string): void {
    this._agentStatus.set(participantId, "online");
    this._options.onStatusChange?.(participantId, "online");
  }

  /**
   * Mark agent as offline (e.g., on disconnect).
   */
  setOffline(participantId: string): void {
    this._agentStatus.set(participantId, "offline");
    this._options.onStatusChange?.(participantId, "offline");
  }

  /**
   * Get thinking steps for an agent.
   */
  getSteps(participantId: string): readonly ThinkingStep[] {
    return this._thinkingSteps.get(participantId) || [];
  }

  /**
   * Get current status for an agent.
   */
  getStatus(participantId: string): "online" | "busy" | "offline" {
    return this._agentStatus.get(participantId) || "offline";
  }

  /**
   * Clear thinking steps for an agent.
   */
  clearSteps(participantId: string): void {
    this._thinkingSteps.delete(participantId);
    this._options.onStepsChange?.(participantId, []);
  }

  /**
   * Clear all thinking steps.
   */
  clearAll(): void {
    this._thinkingSteps.clear();
    this._agentStatus.clear();
  }

  private _generateId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
