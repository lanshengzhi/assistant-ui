/** Agent Orchestrator - manages chained agent invocations */

import type { AgentInvoker } from "./agent-invoker";
import { parseMentions } from "./mention-parser";

export type OrchestratorOptions = {
  invoker: AgentInvoker;
  verifyParticipant: (id: string) => boolean;
  /** Maximum invocation depth (default: 5) */
  maxDepth?: number;
  /** Maximum breadth per response (default: 3) */
  maxBreadth?: number;
  /** Maximum invocations per minute per thread (default: 3) */
  maxInvocationsPerMinute?: number;
};

export class AgentOrchestrator {
  private _options: Required<OrchestratorOptions>;
  private _invocationDepth = new Map<string, number>();
  private _invocationTimestamps = new Map<string, number[]>();

  constructor(options: OrchestratorOptions) {
    this._options = {
      maxDepth: 5,
      maxBreadth: 3,
      maxInvocationsPerMinute: 3,
      ...options,
    };
  }

  /**
   * Handle an agent response, potentially triggering chained invocations.
   */
  async handleAgentResponse(
    threadId: string,
    agentId: string,
    response: string,
  ): Promise<void> {
    // Parse mentions from response
    const { mentions } = parseMentions(
      response,
      this._options.verifyParticipant,
    );
    const verifiedMentions = mentions.filter((m) => m.verified);

    if (verifiedMentions.length === 0) return;

    // Check depth limit
    const currentDepth = this._invocationDepth.get(threadId) || 0;
    if (currentDepth >= this._options.maxDepth) {
      this._onSystemMessage(
        threadId,
        `⚠️ Maximum agent invocation depth (${this._options.maxDepth}) reached. ` +
          `Chained invocations stopped to prevent infinite loops.`,
      );
      return;
    }

    // Check rate limit
    if (!this._checkRateLimit(threadId)) {
      this._onSystemMessage(
        threadId,
        `⚠️ Rate limit exceeded (${this._options.maxInvocationsPerMinute} invocations/minute). ` +
          `Please wait before invoking more agents.`,
      );
      return;
    }

    // Apply breadth limit
    const limitedMentions = verifiedMentions.slice(0, this._options.maxBreadth);

    // Increment depth
    this._invocationDepth.set(threadId, currentDepth + 1);

    try {
      // Queue invocations for each mentioned agent
      for (const mention of limitedMentions) {
        if (mention.participantId === agentId) {
          // Prevent self-invocation
          continue;
        }

        // Invoke the agent
        await this._options.invoker.invoke(mention.participantId, {
          threadContext: { messages: [] }, // TODO: Get actual thread context
          message: response,
          mentionedBy: agentId,
          spaceId: "", // TODO: Get from context
          channelId: "", // TODO: Get from context
          threadId,
        });
      }
    } catch (error) {
      // Abort entire chain on error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this._onSystemMessage(
        threadId,
        `❌ Agent chain aborted: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Reset depth for a thread (e.g., when user sends new message).
   */
  resetDepth(threadId: string): void {
    this._invocationDepth.delete(threadId);
  }

  /**
   * Get current depth for a thread.
   */
  getDepth(threadId: string): number {
    return this._invocationDepth.get(threadId) || 0;
  }

  private _checkRateLimit(threadId: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const timestamps = this._invocationTimestamps.get(threadId) || [];
    const recentTimestamps = timestamps.filter((t) => t > oneMinuteAgo);

    if (recentTimestamps.length >= this._options.maxInvocationsPerMinute) {
      return false;
    }

    recentTimestamps.push(now);
    this._invocationTimestamps.set(threadId, recentTimestamps);
    return true;
  }

  private _onSystemMessage(threadId: string, message: string): void {
    // TODO: Post system message to thread
    console.warn(`[${threadId}] ${message}`);
  }
}
