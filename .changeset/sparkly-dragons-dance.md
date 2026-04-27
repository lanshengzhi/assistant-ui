---
"@assistant-ui/core": patch
"@assistant-ui/react": patch
---

feat: Collaborative Space for Human-AI Teams

Implement Space-First architecture enabling multi-participant, multi-agent collaborative workspaces.

**New Features:**
- Space, Channel, Participant domain types with discriminated unions
- Store scopes for space, channel, and participant state management
- SpaceRuntimeCore and ChannelRuntimeCore with CRUD operations
- MultiParticipantMessageRepository for participant-attributed messages
- @mention parser supporting @Name and @"Full Name" syntax
- AgentRegistry for managing CLI daemon agent configurations
- AgentInvoker with HTTP/SSE streaming support
- AgentOrchestrator with depth/breadth limits and chain invocation
- ThinkingStreamHandler for real-time agent thinking steps
- Space and Channel UI primitives
- Multi-participant message components (Author, Reactions, Reply)
- Agent profile and thinking indicator components
- Space administration UI (Settings, ChannelManager, AgentRegistration, ParticipantManager)
- PresenceManager with idle detection and SSE transport

**Architecture:**
- Space → Channel → Thread hierarchical containment
- Participant model replaces role enum for message attribution
- Agents invoked via @mention with HTTP + SSE to local CLI daemon
- Real-time presence tracking with auto-reconnect

**Security:**
- Agent authentication via tokens
- Rate limiting (3 invocations/minute per thread)
- Max invocation depth (5) and breadth (3) limits
