---
date: 2026-04-27
topic: collaborative-space-for-human-ai-teams
---

# Collaborative Space for Human-AI Teams

## Problem Frame

Current assistant-ui is designed around a single-user, single-assistant thread model (`system|user|assistant`). This makes it impossible to build collaborative spaces where multiple human developers and AI agents work together as peers — a pattern demonstrated by slock.ai and requested by teams using assistant-ui for internal tools.

Development teams using assistant-ui today must build custom hacks on top of the thread model to support multi-participant conversations, agent orchestration, and shared workspaces. The lack of first-class space, channel, and participant abstractions forces every team to reinvent the same infrastructure.

This work introduces a `Space-First` architecture that makes multi-participant, multi-agent collaboration a native capability of assistant-ui, starting with development teams but designed to generalize to any human-AI collaborative domain.

---

## Actors

- A1. **Human Developer**: A team member who participates in channels, starts threads, @mentions agents, and reviews agent outputs. Has administrative control over their own messages and can configure agent preferences.
- A2. **AI Agent**: A software participant backed by a local CLI tool (e.g., codex CLI, opencode CLI). Responds only when @mentioned, performs specific tasks (code review, testing, documentation), and displays its thinking process. Has a profile with status, capabilities, and activity history.
- A3. **Space Administrator**: A human with elevated permissions who configures channels, manages agent registrations, and sets team-wide policies.
- A4. **Local CLI Daemon**: The external process that executes agent commands on the developer's machine. Communicates with assistant-ui via a lightweight protocol.

---

## Key Flows

- F1. **Start a collaborative discussion**
  - **Trigger:** A human developer (A1) creates a new thread in a channel to discuss a bug or feature.
  - **Actors:** A1
  - **Steps:**
    1. Developer navigates to a channel (e.g., `#ERP`).
    2. Clicks "New Thread" and enters a title and initial message.
    3. Thread appears in the channel's thread list with the developer as the initiator.
    4. Other participants (humans or agents) can see the thread and join.
  - **Outcome:** A new thread exists within the channel, ready for multi-participant collaboration.
  - **Covered by:** R1, R2, R3

- F2. **Invoke an agent via @mention**
  - **Trigger:** A human developer types `@CodeReviewAgent` in a thread message.
  - **Actors:** A1, A2, A4
  - **Steps:**
    1. Developer composes a message with `@CodeReviewAgent` in the thread.
    2. On send, the system parses the message for @mentions.
    3. The agent's status changes to "busy" and its avatar shows a thinking indicator.
    4. The system invokes the local CLI daemon with the thread context and the specific request.
    5. Agent processes the request (potentially showing intermediate thinking steps).
    6. Agent posts a response message in the thread.
    7. Agent status returns to "online".
  - **Outcome:** The agent's response appears as a message in the thread, attributed to the agent.
  - **Covered by:** R4, R5, R6, R7, R8

- F3. **Review agent output and iterate**
  - **Trigger:** A human developer reads an agent's response and wants to provide feedback or ask follow-up questions.
  - **Actors:** A1, A2
  - **Steps:**
    1. Developer reads the agent's message in the thread.
    2. Developer clicks "Reply in thread" to ask a follow-up question.
    3. Alternatively, developer clicks the agent's avatar to view its profile and thinking history.
    4. Developer @mentions the same or a different agent for further work.
    5. The thread accumulates a multi-turn conversation between human and agent.
  - **Outcome:** The thread contains a rich, multi-turn discussion with clear attribution and history.
  - **Covered by:** R9, R10, R11

- F4. **Agent-to-agent handoff**
  - **Trigger:** An agent determines that another agent's capability is needed (e.g., CodeReviewAgent needs TestAgent to verify a fix).
  - **Actors:** A2, A4
  - **Steps:**
    1. CodeReviewAgent analyzes code and identifies a need for testing.
    2. CodeReviewAgent posts a message in the thread indicating it will invoke TestAgent.
    3. The system routes the request to TestAgent via the local CLI daemon.
    4. TestAgent executes and returns results.
    5. CodeReviewAgent incorporates the results into its final response.
  - **Outcome:** Multiple agents collaborate on a single task within the same thread, visible to all participants.
  - **Covered by:** R12, R13

---

## Requirements

**Space and Channel Model**

- R1. A `Space` is the top-level container for collaborative work. It contains channels, participants (humans and agents), and shared configuration.
- R2. A `Channel` belongs to exactly one Space and contains a list of Threads. Channels have a name, topic, and optional description.
- R3. A `Thread` belongs to exactly one Channel and contains an ordered list of Messages. Threads have a title, initiator, creation time, and last activity time.
- R4. The existing `Thread` and `Message` types remain backward-compatible. Legacy runtimes that do not support Spaces operate in a default implicit Space with a single default Channel.

**Participant Model**

- R5. A `Participant` is an abstract entity that can send messages in a Thread. It has a unique ID, display name, avatar, status (online|busy|offline), and role (human|agent).
- R6. `HumanParticipant` extends Participant with user-specific properties (email, preferences, permissions).
- R7. `AgentParticipant` extends Participant with agent-specific properties (capability list, connected LLM, CLI command path, thinking visibility setting).
- R8. Messages no longer use the `system|user|assistant` enum. Instead, each message has a `participantId` referencing the sender. A migration path maps legacy roles: `user` → the single human participant, `assistant` → the single agent participant, `system` → a special system participant.

**Agent Invocation**

- R9. Messages are parsed for `@mention` syntax. Valid mentions reference a Participant by display name or unique ID.
- R10. When a message contains an @mention to an Agent, the system invokes that agent via its configured CLI command, passing the thread context (message history, relevant files) as input.
- R11. Agents only respond when explicitly @mentioned. Agents do not autonomously participate in threads unless summoned.
- R12. An agent can @mention another agent in its response, triggering a chained invocation. The system prevents infinite loops via a maximum invocation depth.

**Agent Thinking and Visibility**

- R13. While processing a request, an agent's status is "busy" and its avatar displays a thinking indicator.
- R14. Agents expose their thinking process as a sequence of steps (e.g., "Analyzing file...", "Identifying issues...", "Generating report..."). This is visible when a user clicks the agent's avatar to open its profile.
- R15. Agent profiles display: current status, connected LLM, capability list, recent activity feed, and thinking history for the current thread.

**Message and Interaction**

- R16. Messages support rich text formatting including code blocks with syntax highlighting, inline code, and diff blocks.
- R17. Thread messages support threading (replies to specific messages) to keep multi-turn conversations organized.
- R18. All participants in a thread can see all messages. There are no private messages between agents within a thread.
- R19. Messages can be marked with reactions (emoji) by any participant, including agents.

**Space Administration**

- R20. Space administrators can create, rename, and archive channels.
- R21. Space administrators can register and configure agents: set display name, avatar, CLI command, capabilities, and LLM configuration.
- R22. Space administrators can invite human participants and set their roles (member, admin).

**Real-time Presence**

- R23. The system tracks participant presence (online, away, offline) per space.
- R24. Presence changes are broadcast to all connected clients in real-time.
- R25. Agent presence reflects the actual state of the local CLI daemon connection.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given a team has created a Space called "Platform Team" with channels `#ERP`, `#SCM`, and `#IOT`, when Alice clicks "New Thread" in `#ERP` and types "Bug: login timeout on high latency", then a new thread appears in `#ERP` with Alice as the initiator and her message as the first post.

- AE2. **Covers R5, R6, R7, R9, R10, R13, R14.** Given a thread exists with CodeReviewAgent registered, when Bob posts "@CodeReviewAgent please review `auth.ts`", then CodeReviewAgent's avatar shows a thinking indicator, its status changes to busy, and after processing it posts a message with review findings. When Bob clicks CodeReviewAgent's avatar, he sees its thinking steps: "Loading auth.ts...", "Checking error handling...", "Generating suggestions...".

- AE3. **Covers R11, R12.** Given CodeReviewAgent is processing a review and determines tests are needed, when CodeReviewAgent posts "I'll ask @TestAgent to verify this", then TestAgent is invoked with the relevant context, processes the request, and returns results visible in the same thread.

- AE4. **Covers R8, R16, R17, R18.** Given a legacy assistant-ui app using the old `user|assistant` model, when it upgrades to the new version, then existing threads continue to work with roles mapped to implicit participants. The app can optionally migrate to explicit participants over time.

---

## Success Criteria

- A development team can create a Space, set up 2-3 channels, invite 3-5 human developers, register 2-3 local CLI agents, and have a multi-turn collaborative discussion where agents are invoked via @mention and their thinking process is visible.
- Existing assistant-ui applications continue to work without modification after upgrading (backward compatibility).
- The new architecture supports future extensions: cross-space agent identity, persistent agent memory, and advanced orchestration, without requiring breaking changes.

---

## Scope Boundaries

### Deferred for later

- Cross-space agent memory and identity (Phase 3 of the original ideation).
- Voice/audio interaction (voice-only mode).
- Spatial canvas UI (Figma-like non-linear workspace).
- Advanced agent reputation and delegation graphs.
- Mobile app or IDE plugin versions.
- Enterprise SSO, audit logs, and compliance features.

### Outside this product's identity

- Building a hosted SaaS version of the collaborative space (assistant-ui is a library, not a product).
- Competing with Slack, Discord, or Microsoft Teams as a general chat platform.
- Building proprietary AI agents (the library integrates external CLI agents, it does not ship its own).
- Real-time code editing or pair programming (out of scope for v1; focus is on discussion and review).

---

## Key Decisions

- **Space-First Architecture:** Chose full architectural refactor (Option B) over incremental approaches because the current thread-centric model is a fundamental constraint that incremental changes cannot escape. The team is willing to accept the engineering cost for long-term flexibility.
- **Agent via Local CLI:** Agents are external CLI processes rather than in-process functions. This aligns with slock.ai's "agents run on your own computers" philosophy and allows teams to use any CLI tool without vendor lock-in.
- **@mention Trigger Only:** Agents only respond when explicitly @mentioned. This prevents noise and information overload, making agent participation intentional rather than ambient.
- **Web UI First:** The initial implementation targets web browsers. IDE plugins and mobile are deferred.
- **Text-First Messages:** Messages are primarily text with code blocks and diffs. Rich interactive components (buttons, forms) are deferred to avoid premature complexity.

---

## Dependencies / Assumptions

- Teams have local CLI coding agents installed (codex CLI, opencode CLI, or custom equivalents).
- The local machine can run a lightweight daemon or service that assistant-ui communicates with to invoke agents.
- The tap reactive system (`@assistant-ui/tap`) is stable enough to serve as the foundation for Space-level reactive state.
- There is sufficient engineering capacity to execute a multi-month architectural refactor.
- The community is willing to adopt breaking changes if migration paths are provided.

---

## Outstanding Questions

### Resolve Before Planning

- [Affects R1, R2][Resolved] Spaces are persisted on a self-hosted backend server (not a SaaS). Teams deploy their own server via Docker or similar. This supports cross-device sync and real-time collaboration without vendor lock-in.
- [Affects R10][Resolved] Agent communication uses HTTP + SSE. The local CLI daemon starts an HTTP server (e.g., localhost:8080). Browser sends POST requests to trigger agents, and agents stream thinking steps and final responses via SSE. This aligns with existing assistant-stream architecture.
- [Affects R8][Resolved] No backward compatibility required for this project. Legacy `system|user|assistant` roles are replaced entirely by the Participant model. This is a greenfield implementation.

### Deferred to Planning

- [Affects R4][Technical] How exactly do we map legacy `system|user|assistant` roles to the new Participant model without breaking existing runtimes?
- [Affects R14][Needs research] What format should agent thinking steps use? Plain text? Structured JSON? Streaming SSE events?
- [Affects R20-R22][Technical] Should space administration be a React component set, a CLI tool, or both?
- [Affects R23-R25][Technical] What transport should real-time presence use? WebSocket? SSE? Abstraction over both?

---

## Next Steps

-> Resume `/ce-brainstorm` to resolve the 3 blocking questions in "Resolve Before Planning" before proceeding to `/ce-plan`.

Once blocking questions are resolved, proceed to `/ce-plan` for structured implementation planning.
