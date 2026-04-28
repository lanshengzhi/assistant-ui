/** Participant types for collaborative workspace */

export type ParticipantStatus = "online" | "busy" | "away" | "offline";

export type ParticipantRole = "human" | "agent" | "system";

export type AgentCapabilities = {
  /** Available tool names */
  readonly tools: readonly string[];
  /** Supported input types */
  readonly inputTypes: readonly string[];
  /** Human-readable description */
  readonly description?: string;
};

export type ThinkingStep = {
  readonly id: string;
  readonly message: string;
  readonly timestamp: number;
};

export type ParticipantBase = {
  readonly id: string;
  readonly displayName: string;
  readonly avatar?: string;
  readonly status: ParticipantStatus;
  readonly role: ParticipantRole;
  readonly joinedAt: Date;
};

export type HumanParticipant = ParticipantBase & {
  readonly role: "human";
  /** Email for invitations */
  readonly email?: string;
};

export type AgentParticipant = ParticipantBase & {
  readonly role: "agent";
  readonly capabilities: AgentCapabilities;
  /** CLI daemon configuration */
  readonly daemonConfig?: {
    readonly port: number;
    /** Authentication token for daemon */
    readonly authToken?: string;
  };
  /** Thinking steps for current thread */
  readonly thinkingSteps?: readonly ThinkingStep[];
};

export type SystemParticipant = ParticipantBase & {
  readonly role: "system";
};

export type Participant =
  | HumanParticipant
  | AgentParticipant
  | SystemParticipant;
