# System-Wide Test Check Report

## Date: 2026-04-28
## Plan: Collaborative Space for Human-AI Teams

---

## 1. Interaction Graph Verification

### Expected Interactions
- ✅ Space runtime initializes Channel and Participant runtimes
- ⚠️ Thread runtime references Participant runtime for message attribution
- ✅ Agent invoker triggers when @mention parser detects agent mentions
- ✅ Agent orchestrator coordinates chained invocations
- ✅ Presence manager broadcasts status changes via SSE

### Issues Found

#### Issue-1: Space-Channel Runtime Coupling
**Severity**: Medium
**Location**: `packages/core/src/runtime/space-runtime-core.ts`
**Problem**: `LocalSpaceRuntimeCore` manages channel data but does not instantiate or manage `ChannelRuntimeCore` instances. There's a data-only relationship, not a runtime hierarchy.
**Impact**: Channels exist as data objects but lack active runtime management.
**Recommendation**: SpaceRuntimeCore should maintain a Map of ChannelRuntimeCore instances.

#### Issue-2: Thread-Participant Attribution Gap
**Severity**: High
**Location**: `packages/core/src/runtime/utils/multi-participant-message-repository.ts`
**Problem**: `MultiParticipantMessageRepository` stores `participantId` but there's no validation that the participant exists in the `ParticipantRepository` when adding messages.
**Impact**: Messages can reference non-existent participants.
**Recommendation**: Add validation in `addOrUpdateMessage` to check participant existence.

#### Issue-3: Agent Orchestrator Depth Reset Bug
**Severity**: High
**Location**: `packages/core/src/runtime/agent/agent-orchestrator.ts:95`
**Problem**: `this._invocationDepth.set(threadId, currentDepth)` resets depth after each invocation, preventing depth limit from working correctly.
**Impact**: Chain depth limit (maxDepth=5) never triggers.
**Recommendation**: Remove the depth reset on line 95. Depth should only be reset via `resetDepth()`.

---

## 2. Error Propagation Verification

### Expected Error Paths
- ✅ Agent invocation errors: Displayed as system messages in thread
- ✅ CLI daemon connection errors: Agent status → offline
- ⚠️ SSE connection errors: Presence shows stale data with reconnect indicator
- ✅ Max invocation depth exceeded: System message explaining limit

### Issues Found

#### Issue-4: Agent Error Handling Incomplete
**Severity**: Medium
**Location**: `packages/core/src/runtime/agent/agent-invoker.ts`
**Problem**: Error callback is invoked but the error message is not persisted to the thread.
**Impact**: Users see errors in console but not in the UI.
**Recommendation**: Integrate with `MultiParticipantMessageRepository` to post system messages on errors.

#### Issue-5: Presence Transport Error Recovery
**Severity**: Low
**Location**: `packages/core/src/runtime/presence/sse-presence-transport.ts`
**Problem**: Auto-reconnect works but there's no visual indicator for stale data during reconnection.
**Impact**: Users may not realize presence data is stale.
**Recommendation**: Add `isReconnecting` state to `PresenceManager`.

---

## 3. State Lifecycle Risks

### Identified Risks

#### Risk-1: Partial Thread Creation
**Severity**: Medium
**Problem**: If channel creation succeeds but thread creation fails, we have an orphaned channel.
**Mitigation**: Implement atomic operations or rollback mechanism.

#### Risk-2: Agent Invocation During Disconnect
**Severity**: High
**Problem**: If agent is invoked while daemon is offline, the request fails with no retry.
**Mitigation**: Queue invocations and retry with exponential backoff.

#### Risk-3: Memory Leaks in Long-Running Threads
**Severity**: Medium
**Problem**: `MultiParticipantMessageRepository` keeps all messages in memory indefinitely.
**Mitigation**: Implement message pagination or pruning.

#### Risk-4: Presence Broadcast Storms
**Severity**: Low
**Problem**: Rapid status changes could flood the SSE transport.
**Mitigation**: Throttle updates via `tap scheduler` (already mentioned in plan).

---

## 4. API Surface Parity

### React Native Distribution
**Status**: ⚠️ Not Implemented
**Impact**: React Native apps cannot use collaborative space features.
**Recommendation**: Add equivalent runtime support in React Native distribution.

### Core Types Sharing
**Status**: ✅ Complete
**Verification**: Types exported from `@assistant-ui/core` and re-exported correctly.

---

## 5. Integration Coverage Gaps

### Missing Integration Tests
1. **Agent-to-agent handoff**: End-to-end test (mention → invoke → respond → parse → invoke)
2. **Real-time presence**: Multi-client test (browser A updates, browser B receives)
3. **Full flow**: Create space → add participant → send message with @mention → agent responds with thinking → participant replies

### Recommendation
Add integration test suite using mock SSE transport and mock daemon client.

---

## Summary

| Category | Issues Found | Severity Distribution |
|----------|--------------|---------------------|
| Interaction Graph | 3 | 2 High, 1 Medium |
| Error Propagation | 2 | 1 Medium, 1 Low |
| State Lifecycle | 4 | 1 High, 2 Medium, 1 Low |
| API Parity | 1 | 1 Medium |

**Critical Fixes Needed:**
1. Fix AgentOrchestrator depth reset bug (Issue-3)
2. Add participant validation in message repository (Issue-2)
3. Implement agent invocation retry queue (Risk-2)

