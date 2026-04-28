/** Agent Invoker */

import type { AgentRegistry } from "./agent-registry";
import type { CLIDaemonClient } from "./cli-daemon-client";
import type { AgentInvocationRequest } from "./protocol";
import type { Participant } from "../../types/participant";

export type AgentInvokerOptions = {
  registry: AgentRegistry;
  createClient: (config: {
    port: number;
    authToken?: string;
  }) => CLIDaemonClient;
  onMessage: (message: { participantId: string; content: string }) => void;
  onThinkingStep: (
    participantId: string,
    step: { id: string; message: string; timestamp: number },
  ) => void;
  onError: (error: { participantId: string; message: string }) => void;
  onStatusChange: (
    participantId: string,
    status: Participant["status"],
  ) => void;
};

export class AgentInvoker {
  private _options: AgentInvokerOptions;
  private _activeInvocations = new Map<string, CLIDaemonClient>();

  constructor(options: AgentInvokerOptions) {
    this._options = options;
  }

  /**
   * Invoke an agent by participant ID.
   */
  async invoke(
    agentId: string,
    request: Omit<AgentInvocationRequest, "agentId">,
  ): Promise<void> {
    const agent = this._options.registry.get(agentId);
    if (!agent) {
      this._options.onError({
        participantId: agentId,
        message: `Agent "${agentId}" not found`,
      });
      return;
    }

    // Cancel any existing invocation for this agent
    this.cancel(agentId);

    // Set status to busy
    this._options.onStatusChange(agentId, "busy");

    // Create client
    const client = this._options.createClient({
      port: agent.daemonPort,
      authToken: agent.authToken,
    });
    this._activeInvocations.set(agentId, client);

    const fullRequest: AgentInvocationRequest = {
      ...request,
      agentId,
    };

    let messageContent = "";
    const thinkingSteps: Array<{
      id: string;
      message: string;
      timestamp: number;
    }> = [];

    try {
      await client.invoke(fullRequest, {
        onThinkingStep: (step) => {
          thinkingSteps.push(step);
          this._options.onThinkingStep(agentId, step);
        },
        onMessage: (content) => {
          messageContent += content;
        },
        onComplete: () => {
          try {
            // Only send message if there's content
            if (messageContent.trim()) {
              this._options.onMessage({
                participantId: agentId,
                content: messageContent,
              });
            }
          } catch (callbackError) {
            console.error(
              "AgentInvoker onMessage callback failed:",
              callbackError,
            );
          } finally {
            this._cleanup(agentId);
          }
        },
        onError: (error) => {
          try {
            this._options.onError({
              participantId: agentId,
              message: error.message,
            });
          } catch (callbackError) {
            console.error(
              "AgentInvoker onError callback failed:",
              callbackError,
            );
          } finally {
            this._cleanup(agentId);
          }
        },
      });
    } catch (error) {
      this._options.onError({
        participantId: agentId,
        message: error instanceof Error ? error.message : String(error),
      });
      this._cleanup(agentId);
    }
  }

  /**
   * Cancel an ongoing agent invocation.
   */
  cancel(agentId: string): void {
    const client = this._activeInvocations.get(agentId);
    if (client) {
      client.cancel();
      this._activeInvocations.delete(agentId);
    }
  }

  /**
   * Cancel all active invocations.
   */
  cancelAll(): void {
    for (const [_agentId, client] of this._activeInvocations) {
      client.cancel();
    }
    this._activeInvocations.clear();
  }

  private _cleanup(agentId: string): void {
    this._activeInvocations.delete(agentId);
    this._options.onStatusChange(agentId, "online");
  }
}
