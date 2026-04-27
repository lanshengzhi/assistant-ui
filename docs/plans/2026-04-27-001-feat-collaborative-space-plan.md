---
title: "Collaborative Space for Human-AI Teams"
type: feat
status: active
date: 2026-04-27
origin: docs/brainstorms/2026-04-27-collaborative-space-requirements.md
deepened: 2026-04-27
---

# Collaborative Space for Human-AI Teams

## Overview

Introduce a Space-First architecture to assistant-ui that enables multi-participant, multi-agent collaborative workspaces. This transforms assistant-ui from a single-user/single-assistant thread model into a platform where human developers and AI agents work together as peers in channels, threads, and discussions.

The implementation introduces core abstractions: **Space** (top-level workspace container), **Channel** (organizational unit containing threads), **Participant** (human or agent message sender), and **Agent** (CLI-backed AI participant with thinking visibility). Agents are invoked via @mention syntax and communicate through HTTP + SSE streams to a local CLI daemon.

---

## Problem Frame

Current assistant-ui is designed around a single-user, single-assistant thread model (`system|user|assistant`). This constraint makes it impossible to build collaborative spaces where multiple human developers and AI agents work together as peers—a pattern demonstrated by slock.ai and requested by teams using assistant-ui for internal tools.

Development teams must currently build custom hacks on top of the thread model to support multi-participant conversations, agent orchestration, and shared workspaces. The lack of first-class space, channel, and participant abstractions forces every team to reinvent the same infrastructure.

This work makes multi-participant, multi-agent collaboration a native capability, starting with development teams but designed to generalize to any human-AI collaborative domain.

---

## Requirements Trace

- **R1-R3:** Space, Channel, and Thread model with hierarchical containment (Space → Channel → Thread)
- **R4:** Space model is greenfield with no legacy baggage in new APIs. Legacy `ThreadRuntimeCore` paths remain functional via adapter layer, preserving existing single-user app behavior while Space APIs use Participant model exclusively
- **R5-R8:** Participant model with HumanParticipant and AgentParticipant subtypes; messages reference sender via `participantId`
- **R9-R12:** Agent invocation via @mention syntax; chained agent invocation with loop prevention
- **R13-R15:** Agent thinking visibility through streaming steps; agent profile with status, capabilities, and history
- **R16-R19:** Rich message formatting, threaded replies, reactions, and transparent message visibility
- **R20-R22:** Space administration for channels, agent registration, and participant management
- **R23-R25:** Real-time presence tracking for participants with live status updates

**Origin actors:** A1 (Human Developer), A2 (AI Agent), A3 (Space Administrator), A4 (Local CLI Daemon)
**Origin flows:** F1 (Start collaborative discussion), F2 (Invoke agent via @mention), F3 (Review agent output), F4 (Agent-to-agent handoff)
**Origin acceptance examples:** AE1 (Space creation), AE2 (Agent invocation with thinking), AE3 (Chained agent invocation), AE4 (Message threading)

---

## Scope Boundaries

### Outside this product's identity

- Hosted SaaS version of collaborative space (assistant-ui is a library, not a product)
- General chat platform competing with Slack/Discord
- Proprietary AI agents (library integrates external CLI agents only)
- Real-time code editing or pair programming (v1 focus is discussion and review)

### Deferred for later

- Cross-space agent memory and identity
- Voice/audio interaction
- Spatial canvas UI (Figma-like workspace)
- Advanced agent reputation and delegation graphs
- Mobile app or IDE plugin versions
- Enterprise SSO, audit logs, and compliance

### Deferred to Follow-Up Work

- Migration guide for legacy single-user apps: Separate documentation PR after v1 stabilizes
- Advanced agent marketplace/discovery: Future iteration
- Cross-space search and discovery: Phase 2

---

## Context & Research

### Relevant Code and Patterns

**Tap Reactive System (`@assistant-ui/tap`):**
- Zero-dependency reactive primitives (`tapState`, `tapEffect`, `tapMemo`, `resource`)
- Resource-based architecture with `ResourceFiber` and batched updates via `UpdateScheduler`
- React integration via `useResource()` hook

**Store Layer (`@assistant-ui/store`):**
- Type-safe client trees via `ScopeRegistry` module augmentation
- `tapClientResource`, `tapClientLookup`, `tapClientList` for client composition
- `NotificationManager` for internal event bus
- Pattern: `ExternalThread` receives messages as props, creates `MessageClient` resources via `tapClientLookup`

**Message Types (`@assistant-ui/core`):**
- `ThreadMessage` union type with `role: "system" | "user" | "assistant"`
- `ThreadUserMessage` and `ThreadAssistantMessage` with content parts
- `AppendMessage` for creating new messages

**Streaming Infrastructure:**
- `assistant-stream` package with SSE encoder/decoder (`SSEEncoder`, `SSEDecoder`)
- `AssistantStream` type: `ReadableStream<AssistantStreamChunk>`
- `AssistantMessageAccumulator` for accumulating chunks into complete messages
- Web Streams API pattern: `fetch()` → `pipeThrough(decoder)` → `pipeThrough(accumulator)`
- AbortController for cancellation

**Runtime Architecture:**
- Legacy: `ThreadRuntimeCore`, `AssistantRuntimeCore`, `MessageRepository`
- New tap-native: `ExternalThread`, `InMemoryThreadList`, `SingleThreadList`
- Migration ongoing from runtime-core to tap-native clients

### External References

- **SSE Pattern:** Established in `assistant-stream` package with proper encoding/decoding
- **HTTP Transport:** Fetch + ReadableStream standard throughout codebase
- **A2A Protocol:** `A2AClient` demonstrates mature SSE streaming client patterns
- **OpenCode Event Source:** Resilient event source with auto-reconnect and exponential backoff

---

## Key Technical Decisions

**1. Agent Thinking Format: Structured SSE Events**
Agent thinking steps use Server-Sent Events with structured JSON payloads, following the existing `AssistantStreamChunk` pattern in `assistant-stream`.

**Rationale:**
- **Streaming support:** SSE provides native HTTP streaming without WebSocket complexity
- **Structured metadata:** JSON payloads allow step timestamps, types, and versioning
- **Existing infrastructure:** `assistant-stream` already has SSE encoder/decoder; zero new dependencies
- **Schema evolution:** Event type discrimination (`type: "thinking-step"`) allows adding new step types without breaking changes

**Tradeoffs considered:**
- *WebSocket:* Would support bidirectional thinking but requires dedicated connection management and proxy configuration. SSE is sufficient for server→client thinking streams.
- *NDJSON:* Simpler parsing but no built-in reconnection or event IDs. SSE's `Last-Event-ID` enables replay after reconnect.
- *HTTP/2 server push:* Not universally supported by self-hosted deployments; SSE works over HTTP/1.1.

**2. Space Administration: React Component Set**
Space administration UI is implemented as React components in `@assistant-ui/react`, consistent with assistant-ui's identity as a component library (not a SaaS product). Teams embed these components in their own applications.

**3. Real-time Presence: SSE + HTTP**
Real-time presence uses SSE for server→client updates (broadcasts) and HTTP POST for client→server updates.

**Rationale:**
- **Existing infrastructure:** `assistant-stream` already implements SSE encoding/decoding; no new protocol stack needed
- **Self-hosted simplicity:** SSE works through standard HTTP proxies without upgrade headers or sticky sessions; ideal for teams deploying their own server via Docker
- **Sufficient bidirectional capability:** Presence needs occasional client→server updates (status changes) and frequent server→client broadcasts; SSE+HTTP covers both without WebSocket overhead
- **Built-in reliability:** SSE supports `Last-Event-ID` for replay after reconnect; WebSocket requires custom reconnection logic

**Tradeoffs considered:**
- *WebSocket:* Better for true bidirectional streaming but requires explicit proxy support and connection state management. For presence (lightweight events), SSE is adequate.
- *Polling:* Simpler but introduces latency and unnecessary load; rejected for real-time requirements.
- *Counter-risk acknowledged:* SSE suffers from proxy buffering and browser connection limits (6 per domain). Mitigation: use HTTP/2 multiplexing or consolidate presence/events into single SSE stream.

**4. Greenfield Space APIs with Legacy Adapter**
The new Space APIs use the Participant model exclusively with no `system|user|assistant` role baggage. Legacy `ThreadRuntimeCore` paths remain untouched and functional via adapter layer.

**Rationale:**
- **Clean separation:** Space APIs (Space, Channel, Participant, multi-participant Thread) are designed without legacy constraints
- **Preserved investment:** Existing single-user apps using `useLocalRuntime()` or `useExternalStoreRuntime()` continue working unchanged
- **Explicit boundary:** New Space runtime is separate code path; legacy runtime is not polluted with backward-compatibility shims

**Alternative considered:**
- *Adapter approach:* Map legacy `ThreadMessage` roles to Participant types within existing runtime. **Rejected** because it would couple legacy and new code, creating maintenance burden and type fragility. Instead, legacy and Space runtimes coexist as parallel implementations.

**Clarification:**
"Greenfield" applies to the Space model only. The legacy runtime is frozen but functional. Teams migrate to Space APIs explicitly when ready.

**5. Agent Communication: HTTP + SSE to Local CLI Daemon**
Agents are external CLI processes that start an HTTP server (e.g., localhost:8080). The browser sends POST requests to trigger agents, and agents stream thinking steps and responses via SSE.

**Rationale:**
- **Alignment with existing architecture:** `assistant-stream` already uses SSE; agents leverage same infrastructure
- **slock.ai philosophy:** Agents run on developer machines as persistent services, not ephemeral processes
- **Stateful agent capabilities:** Long-running daemon enables agent memory, caching, and warm-start across invocations

**Alternative considered (stdio-based invocation):**
- *Model Context Protocol pattern:* Spawn process per @mention, communicate over stdin/stdout. **Rejected** because:
  - *Startup latency:* Cold start per invocation (500ms-2s) is unacceptable for interactive chat
  - *State isolation:* Each invocation is stateless; no memory of previous interactions in thread
  - *Lifetime management:* Process per call creates zombie/orphan process risks
  - *Streaming complexity:* Stdio requires custom framing for streaming thinking steps; SSE is standard

**Tradeoffs accepted:**
- *Port discovery:* HTTP daemon requires port allocation and discovery (deferred to implementation). Mitigation: default port with configuration override.
- *Security surface:* Persistent localhost server increases attack surface vs ephemeral process. Mitigation: origin validation + signed tokens (see Risks & Dependencies).

---

## Open Questions

### Resolved During Planning

- **Agent thinking format:** Structured SSE events with JSON payloads (see Key Technical Decisions)
- **Space administration approach:** React components in `@assistant-ui/react` (see Key Technical Decisions)
- **Real-time presence transport:** SSE for broadcast, HTTP for updates (see Key Technical Decisions)

### Deferred to Implementation

- **Exact CLI daemon discovery mechanism:** How does the browser discover the local CLI daemon port? Options: fixed default port with fallback, configuration in Space settings, or environment variable. Decision deferred to implementation when we can prototype the developer experience.
- **Agent capability schema:** What fields define an agent's capabilities? Basic string list is assumed, but detailed schema (input types, output formats, file patterns) deferred to when we integrate with actual CLI tools.
- **Thread pagination strategy:** How many messages load initially? Cursor-based or offset? Deferred to implementation based on performance testing with realistic thread sizes.
- **Security token implementation:** Exact mechanism for daemon authentication (signed JWT, HMAC, or origin validation) deferred to implementation when we can evaluate crypto libraries and key management.
- **Rate limiting implementation:** Whether to use in-memory rate limiting or integrate with a shared store (Redis) for multi-instance deployments. Deferred to implementation based on deployment target.

---

## Output Structure

```
packages/
├── core/src/
│   ├── types/
│   │   ├── space.ts              # Space, Channel types
│   │   ├── participant.ts        # Participant, HumanParticipant, AgentParticipant
│   │   └── message.ts            # Updated ThreadMessage with participantId
│   ├── store/scopes/
│   │   ├── space.ts              # Space scope registration
│   │   ├── channel.ts            # Channel scope registration
│   │   ├── participant.ts        # Participant scope registration
│   │   └── thread.ts             # Updated thread scope
│   └── runtime/
│       ├── space-runtime-core.ts
│       ├── channel-runtime-core.ts
│       └── agent/
│           ├── agent-invoker.ts
│           ├── mention-parser.ts
│           └── thinking-stream.ts
├── react/src/
│   ├── client/
│   │   ├── SpaceClient.ts
│   │   ├── ChannelClient.ts
│   │   └── ParticipantClient.ts
│   ├── primitives/
│   │   ├── space/
│   │   ├── channel/
│   │   ├── participant/
│   │   └── thread/
│   └── ui/
│       └── space-admin/
│           ├── SpaceSettings.tsx
│           ├── ChannelManager.tsx
│           └── AgentRegistration.tsx
└── shared/
    └── protocol/
        ├── agent-invocation.ts
        └── presence-events.ts
```

---

## Implementation Units

### Phase 1: Core Domain Model

- **U1. Space-First Domain Types**

**Goal:** Establish the foundational type system for Space, Channel, Participant, and updated Message model.

**Requirements:** R1-R8

**Dependencies:** None

**Files:**
- Create: `packages/core/src/types/space.ts`
- Create: `packages/core/src/types/participant.ts`
- Modify: `packages/core/src/types/message.ts`
- Create: `packages/core/src/types/index.ts` (exports)

**Approach:**
Define TypeScript interfaces for the new domain model. Space contains Channels, Channels contain Threads. Participant is the base type for message senders. Update ThreadMessage to use `participantId` instead of `role` enum. Since this is greenfield, replace the existing message role model entirely—no migration needed.

**Technical design:**
```typescript
// Directional guidance only
interface Space {
  id: string;
  name: string;
  channels: Channel[];
  participants: Participant[];
}

interface Participant {
  id: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  role: 'human' | 'agent' | 'system';
}

interface ThreadMessage {
  id: string;
  participantId: string;
  content: MessagePart[];
  // ... other fields
}
```

**Patterns to follow:**
- Existing type definitions in `packages/core/src/types/message.ts`
- Pattern of discriminated unions for type variants

**Test scenarios:**
- Happy path: Create Space with 3 channels (`#general`, `#engineering`, `#random`) and 5 participants (3 human, 2 agent)
- Edge case: Empty Space (no channels, no participants) — verify Space object structure is valid
- Edge case: Participant with all optional fields omitted (avatar, status default to offline)
- Edge case: Message with `participantId` referencing non-existent participant (validation should reject)
- Integration: ThreadMessage correctly references Participant by ID; verify bidirectional lookup works

**Verification:**
- Types compile without errors
- Type definitions are importable from `@assistant-ui/core`

---

- **U2. Store Scope Registration**

**Goal:** Register new tap store scopes for Space, Channel, and Participant domains.

**Requirements:** R1-R5

**Dependencies:** U1

**Files:**
- Create: `packages/core/src/store/scopes/space.ts`
- Create: `packages/core/src/store/scopes/channel.ts`
- Create: `packages/core/src/store/scopes/participant.ts`
- Modify: `packages/core/src/store/scope-registration.ts`

**Approach:**
Extend the `ScopeRegistry` via module augmentation to include new scopes. Each scope defines its state shape and methods. Follow the existing pattern for `thread`, `message`, and `composer` scopes.

**Patterns to follow:**
- `packages/core/src/store/scopes/thread.ts`
- `packages/core/src/store/scope-registration.ts`

**Test scenarios:**
- Happy path: Access space state via `useAuiState(s => s.space)` with Space containing 2 channels, verify `state.channels.length === 2`
- Happy path: Register participant scope and retrieve participant list via `useAuiState(s => s.space.participants)`
- Integration: Space scope correctly composes with existing thread scope (thread references parent channel ID)
- Edge case: Access scope before registration — verify TypeScript error or runtime guard

**Verification:**
- Store scopes are accessible via `useAui()` hook
- TypeScript provides correct intellisense for new scopes

---

### Phase 2: Runtime and State Management

- **U3. Space and Channel Runtimes**

**Goal:** Implement runtime cores for Space and Channel management with CRUD operations.

**Requirements:** R1-R3, R20-R22

**Dependencies:** U1, U2

**Files:**
- Create: `packages/core/src/runtime/space-runtime-core.ts`
- Create: `packages/core/src/runtime/channel-runtime-core.ts`
- Create: `packages/core/src/runtime/utils/participant-repository.ts`

**Approach:**
Build runtime cores following the pattern of `LocalThreadRuntimeCore`. SpaceRuntimeCore manages channels and participants. ChannelRuntimeCore manages threads within a channel. ParticipantRepository tracks participant state (online/busy/offline).

**Patterns to follow:**
- `packages/core/src/runtimes/local/local-thread-runtime-core.ts`
- `packages/core/src/runtime/utils/message-repository.ts`

**Test scenarios:**
- Happy path: Create channel, list channels, archive channel
- Happy path: Add participant, update participant status, remove participant
- Edge case: Archive channel with active threads
- Error path: Duplicate channel name within space

**Verification:**
- Runtime cores expose correct interfaces
- State changes propagate through tap reactive system

---

- **U4. Multi-Participant Thread Runtime**

**Goal:** Refactor thread runtime to support multiple participants sending messages.

**Requirements:** R3-R5, R8

**Dependencies:** U1, U3

**Files:**
- Modify: `packages/core/src/runtimes/local/local-thread-runtime-core.ts`
- Create: `packages/core/src/runtime/utils/multi-participant-message-repository.ts`
- Modify: `packages/core/src/types/message.ts` (if needed)

**Approach:**
Update thread runtime to handle messages from any participant, not just single user/assistant. MessageRepository needs to track participant attribution. The `append` method should accept a participant ID.

**Patterns to follow:**
- Existing `MessageRepository` in `packages/core/src/runtime/utils/message-repository.ts`
- Tree-based message storage for branching

**Test scenarios:**
- Happy path: Participant "alice" sends message, then participant "bob" replies; verify both appear with correct attribution
- Happy path: Reply threading — message has `parentId` referencing previous message; verify thread tree structure
- Edge case: Concurrent mutations — two participants append simultaneously; verify no lost updates or duplicate IDs
- Edge case: Message from unknown participant ID (e.g., "user-999" not in repository); verify validation error thrown
- Error path: Append message to archived thread; verify operation rejected with clear error
- Integration: Thread runtime works with updated message types (participantId instead of role enum)

**Verification:**
- Messages correctly attributed to participants
- Thread history displays in chronological order
- Concurrent appends handled safely

---

### Phase 3: Agent Integration

- **U5. @mention Parser and Agent Detection**

**Goal:** Parse messages for @mention syntax and identify agent targets.

**Requirements:** R9, R11

**Dependencies:** U1, U4

**Files:**
- Create: `packages/core/src/runtime/agent/mention-parser.ts`
- Create: `packages/core/src/runtime/agent/agent-registry.ts`

**Approach:**
Build a parser that scans message content for `@AgentName` or `@agent-id` patterns. The parser returns a list of mentioned participant IDs. AgentRegistry maps participant IDs to agent configurations (CLI command, capabilities).

**Technical design:**
```typescript
// Directional guidance only
function parseMentions(content: string): Mention[] {
  // Regex to match @username or @"Full Name" or @uuid
  // Returns array of { participantId, displayName, position }
}
```

**Patterns to follow:**
- Simple regex-based parsing (similar to existing content parsers)
- Registry pattern from existing runtime adapters

**Test scenarios:**
- Happy path: Parse message "@CodeReviewAgent please review" → extracts mention for participant "CodeReviewAgent"
- Happy path: Parse message "@Agent1 and @Agent2 help" → extracts 2 mentions with correct positions
- Edge case: @mention at start (`@agent hi`), middle (`hi @agent there`), end (`hi @agent`)
- Edge case: Escaped @mention (`\@AgentName`) → no mention extracted
- Edge case: Email address `user@example.com` → no mention extracted
- Edge case: Mention with quotes `@"Full Name"` → extracts "Full Name" as display name
- Error path: @mention referencing non-existent participant ID → returns unverified mention flag
- Edge case: Empty message → returns empty mention array
- Integration: Parser correctly integrates with AgentRegistry lookup (mention → agent config)

**Verification:**
- Parser correctly identifies all mention syntaxes
- Non-existent participants are flagged

---

- **U6. Agent Invoker and HTTP Client**

**Goal:** Implement HTTP client to invoke agents via local CLI daemon and handle responses.

**Requirements:** R10, R12

**Dependencies:** U5

**Files:**
- Create: `packages/core/src/runtime/agent/agent-invoker.ts`
- Create: `packages/core/src/runtime/agent/cli-daemon-client.ts`
- Create: `packages/shared/protocol/agent-invocation.ts`

**Approach:**
Build an HTTP client that POSTs to the local CLI daemon with thread context and request. Uses SSE to receive streaming responses. Integrates with `assistant-stream` infrastructure for SSE handling.

**Technical design:**
```typescript
// Directional guidance only
interface AgentInvocationRequest {
  agentId: string;
  threadContext: ThreadContext;
  message: string;
  mentionedBy: string;
}

// HTTP POST to localhost:${daemonPort}/invoke
// Response is SSE stream with thinking steps and final message
```

**Patterns to follow:**
- `packages/react-a2a/src/A2AClient.ts` for SSE streaming pattern
- `packages/assistant-stream` for SSE encoding/decoding
- AbortController for cancellation

**Test scenarios:**
- Happy path: Invoke agent with thread context containing 5 messages; receive successful response within 30s
- Happy path: Agent streams 3 thinking steps via SSE, then final response message
- Error path: CLI daemon unreachable (connection refused); verify error message posted as system message in thread
- Error path: Agent returns HTTP 500; verify graceful error handling without crashing thread
- Error path: Request timeout (agent exceeds 60s); verify timeout message and agent status reset to offline
- Error path: Mid-stream failure (agent streams 2 thinking steps then disconnects); verify partial thinking preserved and status updated
- Security: Verify request includes authentication token; daemon rejects request without valid token
- Edge case: Agent returns empty response; verify no empty message posted (or placeholder message)
- Integration: Agent response correctly attributed to AgentParticipant with thinking steps visible

**Verification:**
- Agent invocations complete successfully
- Errors are handled gracefully with user feedback

---

- **U7. Agent Orchestrator (Chained Invocation)**

**Goal:** Handle agent-to-agent handoffs and prevent infinite invocation loops.

**Requirements:** R12

**Dependencies:** U6

**Files:**
- Create: `packages/core/src/runtime/agent/agent-orchestrator.ts`

**Approach:**
Orchestrator manages the invocation queue. When an agent response contains @mentions, it queues those invocations. Tracks invocation depth and aborts if max depth is exceeded (e.g., 5 levels deep).

**Technical design:**
```typescript
// Directional guidance only
class AgentOrchestrator {
  private invocationDepth: Map<threadId, number>;
  private maxDepth = 5;
  
  async handleAgentResponse(threadId: string, response: string) {
    const mentions = parseMentions(response);
    const currentDepth = this.invocationDepth.get(threadId) || 0;
    
    if (currentDepth >= this.maxDepth) {
      // Post system message about max depth reached
      return;
    }
    
    // Queue agent invocations for each mention
  }
}
```

**Test scenarios:**
- Happy path: Agent A mentions Agent B, both execute successfully
- Happy path: Chain of 3 agents (A → B → C) completes within 60s
- Edge case: Max depth reached (5 levels) — chain stops with system message explaining limit
- Edge case: Circular reference (A → B → A) — blocked by depth limit, no infinite loop
- Error path: Agent B fails in A→B→C chain; verify orchestrator aborts entire chain (not skip) and posts error message
- Edge case: Breadth limit — agent response contains @mention to 5 agents; only first 3 are invoked
- Integration: Each agent response appears in thread with correct attribution
- Integration: Chained invocation respects rate limits (max 3 invocations per minute per thread)

**Verification:**
- Chained invocations execute in sequence
- Max depth limit prevents infinite loops

---

- **U8. Agent Thinking Stream Handler**

**Goal:** Receive and display agent thinking steps via SSE stream.

**Requirements:** R13-R15

**Dependencies:** U6

**Files:**
- Create: `packages/core/src/runtime/agent/thinking-stream-handler.ts`
- Create: `packages/shared/protocol/thinking-events.ts`
- Modify: `packages/core/src/types/participant.ts` (add thinking history)

**Approach:**
Extend agent invoker to handle thinking step events from SSE stream. Store thinking steps in agent's state. Update agent status to "busy" when processing.

**Technical design:**
```typescript
// Directional guidance only
interface ThinkingStepEvent {
  type: 'thinking-step';
  step: {
    id: string;
    message: string;
    timestamp: number;
  };
}

// Agent status managed via tapState
// Thinking steps accumulated in array
```

**Patterns to follow:**
- SSE event handling from `assistant-stream` package
- Tap state management for reactive updates

**Test scenarios:**
- Happy path: Agent streams 3 thinking steps, then final response
- Happy path: Agent status changes: online → busy → online
- Edge case: Agent disconnects mid-thinking (status goes offline)
- Integration: Thinking steps visible in agent profile
- Covers AE2: Agent thinking steps visible when viewing profile

**Verification:**
- Thinking steps display in chronological order
- Status indicators update in real-time

---

### Phase 4: UI Components

- **U9. Space and Channel UI Primitives**

**Goal:** Build React primitive components for Space and Channel display.

**Requirements:** R1-R3

**Dependencies:** U2, U3

**Files:**
- Create: `packages/react/src/primitives/space/SpaceRoot.tsx`
- Create: `packages/react/src/primitives/space/SpaceList.tsx`
- Create: `packages/react/src/primitives/channel/ChannelRoot.tsx`
- Create: `packages/react/src/primitives/channel/ChannelList.tsx`
- Create: `packages/react/src/primitives/channel/ThreadList.tsx`

**Approach:**
Build primitive components following the existing pattern (e.g., `ThreadPrimitive`, `MessagePrimitive`). Components are unstyled and composable. Use `useAuiState` to access space/channel state.

**Patterns to follow:**
- `packages/react/src/primitives/thread/ThreadRoot.tsx`
- `packages/react/src/primitives/message/MessageRoot.tsx`
- Pattern: Primitive components + context providers

**Test scenarios:**
- Happy path: Render space with multiple channels
- Happy path: Click channel to view its threads
- Happy path: Thread list updates when new thread created
- Edge case: Empty channel (no threads)

**Verification:**
- Components render without errors
- State changes trigger re-renders

---

- **U10. Multi-Participant Message Components**

**Goal:** Update message primitives to display participant attribution and support reactions.

**Requirements:** R5, R16-R19

**Dependencies:** U4, U9

**Files:**
- Modify: `packages/react/src/primitives/message/MessageRoot.tsx`
- Create: `packages/react/src/primitives/message/MessageAuthor.tsx`
- Create: `packages/react/src/primitives/message/MessageReactions.tsx`
- Create: `packages/react/src/primitives/message/MessageReply.tsx`

**Approach:**
Update message components to show participant avatar and name. Add reaction support. Add reply threading UI. Ensure rich text rendering (code blocks, diffs) works with participant attribution.

**Patterns to follow:**
- Existing message primitive components
- `useAuiState` for participant lookup by ID

**Test scenarios:**
- Happy path: Message displays with correct participant avatar and name
- Happy path: Add reaction to message
- Happy path: Reply to specific message (threading)
- Happy path: Code block renders with syntax highlighting
- Edge case: Message from deleted participant
- Integration: Reactions update in real-time across clients
- Covers AE4: Multi-participant message display

**Verification:**
- Messages clearly attributed to participants
- Reactions persist and display correctly

---

- **U11. Agent Profile and Thinking UI**

**Goal:** Build agent profile components with thinking history display.

**Requirements:** R13-R15

**Dependencies:** U8, U10

**Files:**
- Create: `packages/react/src/primitives/participant/ParticipantAvatar.tsx`
- Create: `packages/react/src/primitives/participant/AgentProfile.tsx`
- Create: `packages/react/src/primitives/participant/ThinkingIndicator.tsx`

**Approach:**
Agent avatar shows thinking indicator when status is "busy". Clicking avatar opens profile modal/page with status, capabilities, recent activity, and thinking history for current thread.

**Patterns to follow:**
- Radix UI primitives (Dialog for profile modal)
- Existing avatar/thinking indicator patterns from AI SDK integrations

**Test scenarios:**
- Happy path: Click agent avatar to open profile
- Happy path: Profile shows current status, capabilities, LLM info
- Happy path: Thinking history visible for current thread
- Happy path: Thinking indicator displays when agent busy
- Edge case: Agent with no thinking history
- Covers AE2: Agent profile with thinking steps

**Verification:**
- Profile displays all agent information
- Thinking indicator animates correctly

---

- **U12. Space Administration Components**

**Goal:** Build React components for space administration (channels, agents, participants).

**Requirements:** R20-R22

**Dependencies:** U3, U9

**Files:**
- Create: `packages/react/src/ui/space-admin/SpaceSettings.tsx`
- Create: `packages/react/src/ui/space-admin/ChannelManager.tsx`
- Create: `packages/react/src/ui/space-admin/AgentRegistration.tsx`
- Create: `packages/react/src/ui/space-admin/ParticipantManager.tsx`

**Approach:**
Build admin UI components following shadcn/ui patterns (since this is a component library). Components manage their own state via `useAui()` and call runtime methods for CRUD operations.

**Patterns to follow:**
- `packages/react/src/ui/` existing patterns
- Radix UI + Tailwind styling
- Form patterns from existing examples

**Test scenarios:**
- Happy path: Create new channel
- Happy path: Rename existing channel
- Happy path: Archive channel
- Happy path: Register new agent with CLI command and capabilities
- Happy path: Invite participant by email
- Happy path: Set participant role (member → admin)
- Error path: Duplicate channel name
- Error path: Invalid CLI command path

**Verification:**
- All admin operations complete successfully
- UI updates reflect state changes immediately

---

### Phase 5: Real-time Presence

- **U13. Presence Tracking and SSE Transport**

**Goal:** Implement real-time presence tracking with SSE updates.

**Requirements:** R23-R25

**Dependencies:** U3

**Files:**
- Create: `packages/core/src/runtime/presence/presence-manager.ts`
- Create: `packages/core/src/runtime/presence/sse-presence-transport.ts`
- Create: `packages/shared/protocol/presence-events.ts`

**Approach:**
PresenceManager tracks participant status per space using tapState. SSE transport connects to server endpoint for real-time updates. Agent presence reflects CLI daemon connection status.

**Technical design:**
```typescript
// Directional guidance only
interface PresenceEvent {
  type: 'presence-update';
  participantId: string;
  status: 'online' | 'away' | 'offline';
  timestamp: number;
}

// SSE connection to /api/spaces/${spaceId}/presence
// HTTP POST to update own presence
```

**Patterns to follow:**
- SSE patterns from `assistant-stream` and `A2AClient`
- Tap state for reactive presence updates

**Test scenarios:**
- Happy path: Participant "alice" comes online, status broadcast to all connected clients within 1s
- Happy path: Agent status reflects CLI daemon connection (online when daemon connected, offline when disconnected)
- Happy path: Status lifecycle: online → away (after 5min idle) → offline (after 30min idle or tab closed)
- Edge case: Browser tab hidden (document.visibilityState = 'hidden') → participant status changes to away
- Edge case: Connection loss (network disconnect) → presence shows stale data with reconnect indicator
- Edge case: Reconnect after 30s offline → presence state syncs correctly
- Edge case: Participant removed from space mid-session → status updates stop broadcasting for that participant ID
- Security: Unauthenticated client attempts to subscribe to SSE → connection rejected with 401
- Security: Client subscribes to space they are not member of → connection rejected with 403
- Integration: Presence updates visible in UI immediately via `useAuiState`

**Verification:**
- Presence updates propagate within 1 second
- Agent status accurately reflects daemon state
- Tab visibility changes trigger appropriate status updates

---

## System-Wide Impact

**Interaction graph:**
- Space runtime initializes Channel and Participant runtimes
- Thread runtime references Participant runtime for message attribution
- Agent invoker triggers when @mention parser detects agent mentions
- Agent orchestrator coordinates chained invocations
- Presence manager broadcasts status changes via SSE

**Error propagation:**
- Agent invocation errors: Displayed as system messages in thread
- CLI daemon connection errors: Agent status → offline
- SSE connection errors: Presence shows stale data with reconnect indicator
- Max invocation depth exceeded: System message explaining limit

**State lifecycle risks:**
- Partial thread creation: Ensure atomic channel+thread creation
- Agent invocation during disconnect: Queue and retry with backoff
- Presence broadcast storms: Throttle presence updates via tap scheduler

**API surface parity:**
- React Native distribution will need equivalent runtime support (Phase 2+ work)
- Core types shared across all distributions

**Integration coverage:**
- Agent-to-agent handoff requires end-to-end test (mention → invoke → respond → parse → invoke)
- Real-time presence requires multi-client test (browser A updates, browser B receives)
- Full flow: Create space → add participant → send message with @mention → agent responds with thinking → participant replies

**Unchanged invariants:**
- Existing single-thread runtimes continue to work via legacy `ThreadRuntimeCore` paths (backward compatibility maintained for existing code)
- Legacy `system|user|assistant` role enum preserved in legacy types; new Space APIs use Participant model exclusively
- Message parts system (text, image, file, etc.) remains unchanged
- Tap reactive primitives remain framework-agnostic

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **SECURITY:** Unauthenticated localhost daemon access | Daemon validates requests via origin whitelist or cryptographically signed token passed from host app at startup |
| **SECURITY:** Agent invocation breadth DoS | `maxBreadthPerInvocation` limit (3 mentions processed per response) + global rate limiter per thread |
| **SECURITY:** Participant identity spoofing | Server-verifiable token (JWT or session-bound signature) required on message append; server validates claimed `participantId` |
| **SECURITY:** SSE presence data leakage | SSE transport requires `Authorization` header; server validates space membership before streaming events |
| **SECURITY:** Thread context data leakage to agents | `ThreadContextFilter` interface allows administrators to configure message ranges shared with each agent; default to current message only |
| **SECURITY:** Malicious agent outputs | Stream timeout (120s), per-message size cap (64KB), strict JSON schema validation, output sanitization before DOM injection |
| CLI daemon discovery complexity | Prototype multiple approaches in implementation; start with fixed default port |
| SSE connection reliability for presence | Implement auto-reconnect with exponential backoff (pattern from OpenCodeEventSource) |
| Agent invocation latency | Make async with loading states; consider request/response timeouts |
| Multi-participant message ordering | **Authoritative server timestamps only** — daemon streams opaque events; server annotates with monotonic timestamp before broadcast |
| Memory leaks in long-running threads | Implement message pagination; virtualized scrolling |
| Cross-platform CLI daemon compatibility | Start with POSIX (macOS/Linux); Windows support deferred |

---

## Documentation / Operational Notes

**Documentation needs:**
- Architecture overview for Space-First model
- Migration guide for teams using legacy single-user model (deferred to follow-up)
- Agent development guide (how to build CLI agents compatible with assistant-ui)
- Self-hosted server deployment guide

**Monitoring considerations:**
- Agent invocation success/failure rates
- CLI daemon connection health
- SSE connection stability metrics
- Thread and message volume per space

**Deployment notes:**
- Requires self-hosted server component for persistence and real-time features
- CLI daemon runs locally on developer machines
- Browser communicates with both server (HTTP/SSE) and local daemon (HTTP)
