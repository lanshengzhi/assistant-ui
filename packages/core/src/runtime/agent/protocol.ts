/** Agent invocation protocol types */

import type { SpaceThreadMessage } from "../types/message";

/** Request to invoke an agent */
export type AgentInvocationRequest = {
  /** Agent participant ID */
  agentId: string;
  /** Thread context (recent messages) */
  threadContext: ThreadContext;
  /** The message that mentioned the agent */
  message: string;
  /** Participant ID who mentioned the agent */
  mentionedBy: string;
  /** Space ID */
  spaceId: string;
  /** Channel ID */
  channelId: string;
  /** Thread ID */
  threadId: string;
};

/** Thread context sent to agent */
export type ThreadContext = {
  /** Recent messages in the thread */
  messages: readonly SpaceThreadMessage[];
  /** Maximum number of messages sent to agent (default: 10) */
  maxMessages?: number;
};

/** Agent invocation response (streaming) */
export type AgentInvocationResponse = {
  /** Final response message */
  message: string;
  /** Thinking steps if any */
  thinkingSteps?: readonly ThinkingStep[];
  /** Whether the response mentions other agents */
  hasMentions: boolean;
  /** Extracted mentions from response */
  mentions?: readonly string[];
};

export type ThinkingStep = {
  id: string;
  message: string;
  timestamp: number;
  type: "thinking" | "tool-call" | "observation";
};

/** SSE event types for agent streaming */
export type AgentStreamEvent =
  | { type: "thinking-step"; step: ThinkingStep }
  | { type: "message"; content: string }
  | { type: "complete" }
  | { type: "error"; error: string };

/** CLI daemon health status */
export type DaemonHealthStatus = {
  status: "healthy" | "unhealthy";
  version?: string;
  uptime?: number;
};
