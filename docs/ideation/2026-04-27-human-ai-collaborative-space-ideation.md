---
date: 2026-04-27
topic: human-ai-collaborative-space
focus: 模仿 https://slock.ai/，实现类似的功能，使得 人类和 AI Agent 在这个空间里协作交流。同时参考 Slack 的 channel 和 thread 概念。
mode: repo-grounded
---

# Ideation: Human-AI Collaborative Space for assistant-ui

## Grounding Context

**Codebase context:** assistant-ui is a TypeScript/React monorepo building an open-source UI library for AI chat experiences. 39 packages, 32 examples, 5 apps. Architecture: tap (reactive primitives) → store (React bridge) → core (shared runtime) → react (web distribution). Existing multi-agent features: react-a2a (A2A protocol), react-ag-ui (AG-UI protocol), cloud (persistence & analytics). Gaps vs slock.ai: no multi-user collaboration model, no real-time presence, thread-centric not space-centric, single-tenancy assumption.

**External context:** slock.ai is a real-time collaboration platform where humans and AI agents work together in channels and DMs. Key features: agents with persistent memory, one conversation where humans and agents are equals, agents run on user's own computers via lightweight daemon. Slack provides channel/thread metaphors for organizing human collaboration.

## Ranked Ideas

### 1. The "Who's Speaking" Identity Crisis
**Description:** Expand the core message role system beyond `system|user|assistant` to support arbitrary participants (humans, agents, swarms) with dynamic capabilities, permissions, and identity. Each participant registers in a space-wide registry with metadata (name, avatar, capabilities, status).
**Warrant:** `direct:` Grounding summary explicitly states "Messages only have system|user|assistant roles" as a gap versus slock.ai's multi-user collaboration model.
**Rationale:** Identity is foundational to collaboration. Without first-class participant types, every downstream feature (permissions, mentions, presence) becomes a hack. This is the prerequisite for all other multi-agent features.
**Downsides:** Breaking change to core Message type; requires migration path for existing runtimes.
**Confidence:** 95%
**Complexity:** Medium
**Status:** Unexplored

### 2. Kill the Thread, Embrace the Canvas
**Description:** Break the linear chat paradigm by introducing a persistent spatial workspace (like Figma or Miro) where messages, files, and agent outputs are nodes that humans and agents can rearrange, cluster, and connect. Conversations become shared knowledge graphs that evolve over time.
**Warrant:** `direct:` Grounding summary explicitly states assistant-ui is "thread-centric, not space-centric" — the chat container itself is the unexamined constraint limiting slock.ai-style collaboration.
**Rationale:** A linear timeline forces hierarchy (who spoke last dominates). Spatial canvases enable true peer collaboration where agents and humans work on the same artifacts simultaneously.
**Downsides:** Major UI paradigm shift; may alienate existing chat-centric users; accessibility challenges.
**Confidence:** 75%
**Complexity:** High
**Status:** Unexplored

### 3. Reactive Space-State as First-Class Primitive ⭐ SELECTED FOR BRAINSTORM
**Description:** Refactor the tap reactive core to treat "space" (not thread) as the fundamental unit of state. Space-state encapsulates participants, permissions, shared context, and activity streams as reactive primitives that both human and agent participants can subscribe to, mutate, and compose.
**Warrant:** `direct:` Grounding identifies "thread-centric, not space-centric" as a core gap, and the architecture already has tap reactive primitives designed for exactly this kind of shared mutable state.
**Rationale:** Once space-state is a first-class primitive, every subsequent feature (presence, typing awareness, agent status, permission changes) builds on the same reactive substrate. The marginal cost of adding new collaboration features drops dramatically.
**Downsides:** Fundamental architectural refactor; impacts all existing packages; long implementation timeline.
**Confidence:** 85%
**Complexity:** High
**Status:** Explored (2026-04-27)

### 4. Event-Sourced Shared Memory Layer
**Description:** Build a persistent event stream on top of cloud/tap that records all space interactions (messages, agent actions, human edits, permission changes) as immutable events. New agents reconstruct full context by replaying events from their join point, and the accumulated history becomes structured training data.
**Warrant:** `reasoned:` Current single-tenancy means runtimes assume one user per thread; event sourcing is the standard pattern for decoupling state from participants and enabling late-joiners to catch up. The cloud package already handles persistence.
**Rationale:** The memory layer compounds in value over time. Early conversations enrich later ones. Agents joining a space immediately inherit collective knowledge without custom onboarding. The event log itself becomes a strategic asset.
**Downsides:** Storage costs; event schema versioning complexity; GDPR/data retention concerns.
**Confidence:** 80%
**Complexity:** High
**Status:** Unexplored

### 5. Agent Self-Onboarding via Capability Registry
**Description:** Extend react-a2a with a standardized capability advertisement protocol where agents declare their skills, constraints, and triggers in a space-wide registry. Agents auto-join spaces where their capabilities match the conversation context, without manual wiring.
**Warrant:** `direct:` react-a2a already exists as an adapter, and the grounding notes "no multi-user collaboration model" where agents operate in isolation. `reasoned:` Network-effect platforms demonstrate that capability discovery creates non-linear value as participants scale.
**Rationale:** Each new agent joining a space makes all existing participants more capable. A human doesn't need to know which agent to ask — they ask the space, and the right agent responds. The platform gets stronger superlinearly with agent count.
**Downsides:** Security implications of auto-joining; spam/malicious agent risk; requires robust capability verification.
**Confidence:** 70%
**Complexity:** Medium
**Status:** Unexplored

### 6. Composable Presence Streams via Tap
**Description:** Expose real-time presence (who/what is in the space, what they're doing, what they're attending to) as composable tap reactive streams. Developers can filter, combine, and transform presence signals to build ambient intelligence without polling or custom WebSocket logic.
**Warrant:** `direct:` Grounding explicitly identifies "no real-time presence or live collaboration layer" as a gap, and tap reactive primitives are architecturally designed for exactly this kind of stream composition.
**Rationale:** Presence becomes infrastructure, not a feature. Once available, agents can react to human attention patterns ("only interrupt if the user is active"), humans can see agent reasoning in real-time, and new interaction patterns emerge without additional backend work.
**Downsides:** Requires new tap operators and likely WebSocket abstractions; may increase bundle size.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 7. Invert the Prompt Model: Agents Observe First
**Description:** Flip from "human asks, agent answers" to "agents observe continuously and volunteer contributions." Humans work normally in the space; agents chime in when relevant, or stay silent. Agents subscribe to space-state changes and proactively offer help rather than waiting for explicit prompts.
**Warrant:** `external:` slock.ai agents run as local daemons with persistent memory — they are always-on participants, not on-demand services. This requires inverting the interaction paradigm.
**Rationale:** Removes the cognitive overhead of deciding when to invoke AI. Makes collaboration effortless by making agents proactive rather than reactive. Transforms agents from tools into teammates.
**Downsides:** Risk of agent noise/interruptions; requires sophisticated relevance filtering; may annoy users if not calibrated well.
**Confidence:** 65%
**Complexity:** High
**Status:** Unexplored

## Rejection Summary

See `/tmp/compound-engineering/ce-ideate/a1b2c3d4/survivors.md` for full rejection details (49 ideas rejected, 7 kept).

## Next Steps

User expressed interest in exploring ideas that incorporate Slack's channel/thread metaphors alongside slock.ai's human-agent equality model. This suggests a synthesis direction: **a Slack-like collaborative space with channels, threads, and AI agents as first-class participants**.
