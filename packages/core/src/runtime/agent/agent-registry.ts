import type {
  AgentParticipant,
  AgentCapabilities,
} from "../../types/participant";

export type AgentConfig = {
  participantId: string;
  displayName: string;
  capabilities: AgentCapabilities;
  /** CLI daemon port (default: 8080) */
  daemonPort: number;
  /** Authentication token for daemon */
  authToken?: string;
  /** Maximum thinking steps to show */
  maxThinkingSteps?: number;
  /** Timeout in seconds (default: 60) */
  timeout?: number;
};

export type AgentRegistry = {
  readonly agents: readonly AgentConfig[];

  /** Register a new agent */
  register(config: AgentConfig): void;

  /** Unregister an agent */
  unregister(participantId: string): void;

  /** Get agent config by participant ID */
  get(participantId: string): AgentConfig | undefined;

  /** Check if participant is a registered agent */
  has(participantId: string): boolean;

  /** Get all registered agents */
  getAll(): readonly AgentConfig[];

  /** Update agent config */
  update(
    participantId: string,
    updates: Partial<Omit<AgentConfig, "participantId">>,
  ): void;
};

export class InMemoryAgentRegistry implements AgentRegistry {
  private _agents = new Map<string, AgentConfig>();

  get agents(): readonly AgentConfig[] {
    return Array.from(this._agents.values());
  }

  register(config: AgentConfig): void {
    this._agents.set(config.participantId, config);
  }

  unregister(participantId: string): void {
    this._agents.delete(participantId);
  }

  get(participantId: string): AgentConfig | undefined {
    return this._agents.get(participantId);
  }

  has(participantId: string): boolean {
    return this._agents.has(participantId);
  }

  getAll(): readonly AgentConfig[] {
    return this.agents;
  }

  update(
    participantId: string,
    updates: Partial<Omit<AgentConfig, "participantId">>,
  ): void {
    const agent = this._agents.get(participantId);
    if (!agent) throw new Error(`Agent ${participantId} not found`);

    this._agents.set(participantId, {
      ...agent,
      ...updates,
    });
  }
}
