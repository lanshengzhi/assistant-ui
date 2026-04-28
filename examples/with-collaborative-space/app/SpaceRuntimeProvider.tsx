import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { LocalSpaceRuntimeCore } from "@assistant-ui/core";
import { AgentOrchestrator } from "@assistant-ui/core";
import { AgentInvoker } from "@assistant-ui/core";
import { HttpCLIDaemonClient } from "@assistant-ui/core";
import type { Participant, SpaceThreadMessage } from "@assistant-ui/core";

interface SpaceRuntimeContextValue {
  runtime: LocalSpaceRuntimeCore;
  orchestrator: AgentOrchestrator;
  messages: SpaceThreadMessage[];
  participants: Participant[];
  sendMessage: (content: string, channelId: string, threadId: string) => void;
  isAgentBusy: boolean;
}

const SpaceRuntimeContext = createContext<SpaceRuntimeContextValue | null>(
  null,
);

export function SpaceRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runtime] = useState(() => {
    const rt = new LocalSpaceRuntimeCore();
    rt.create("Collaborative Space", "A space for human-AI collaboration");

    // Create default channel
    rt.createChannel("general", "General discussion");
    rt.createChannel("code-review", "Code review discussions");

    // Add some participants
    rt.addParticipant({
      id: "user-1",
      displayName: "Alice",
      status: "online",
      role: "human",
      email: "alice@example.com",
    });

    rt.addParticipant({
      id: "agent-1",
      displayName: "CodeReviewAgent",
      status: "online",
      role: "agent",
      capabilities: {
        tools: ["review", "lint"],
        inputTypes: ["code"],
      },
      daemonConfig: {
        port: 8080,
      },
    });

    return rt;
  });

  const [messages, setMessages] = useState<SpaceThreadMessage[]>([]);
  const [participants, _setParticipants] = useState<Participant[]>([]);
  const [isAgentBusy, setIsAgentBusy] = useState(false);

  const invokerRef = useRef<AgentInvoker | null>(null);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);

  useEffect(() => {
    // Set up agent invoker
    const invoker = new AgentInvoker({
      registry: {
        get: (id: string) => {
          const p = runtime.getParticipant(id);
          if (p?.role === "agent") {
            return {
              id: p.id,
              displayName: p.displayName,
              daemonPort: p.daemonConfig?.port || 8080,
              authToken: p.daemonConfig?.authToken,
            };
          }
          return undefined;
        },
      } as any,
      createClient: (config) => new HttpCLIDaemonClient(config),
      onMessage: (msg) => {
        const newMessage: SpaceThreadMessage = {
          id: `msg-${Date.now()}`,
          participantId: msg.participantId,
          content: [{ type: "text", text: msg.content }],
          status: { type: "complete", reason: "stop" },
          createdAt: new Date(),
          metadata: {
            unstable_state: null,
            unstable_annotations: [],
            unstable_data: [],
            steps: [],
            custom: {},
          },
        };
        setMessages((prev) => [...prev, newMessage]);
      },
      onThinkingStep: (participantId, step) => {
        console.log(`[${participantId}] Thinking: ${step.message}`);
      },
      onError: (error) => {
        console.error(`Agent error:`, error);
      },
      onStatusChange: (_participantId, status) => {
        setIsAgentBusy(status === "busy");
      },
    });

    invokerRef.current = invoker;

    // Set up orchestrator
    const orchestrator = new AgentOrchestrator({
      invoker,
      verifyParticipant: (id) => !!runtime.getParticipant(id),
    });

    orchestratorRef.current = orchestrator;
  }, [runtime]);

  const sendMessage = useCallback(
    (content: string, _channelId: string, threadId: string) => {
      const newMessage: SpaceThreadMessage = {
        id: `msg-${Date.now()}`,
        participantId: "user-1", // Current user
        content: [{ type: "text", text: content }],
        status: { type: "complete", reason: "stop" },
        createdAt: new Date(),
        metadata: {
          unstable_state: null,
          unstable_annotations: [],
          unstable_data: [],
          steps: [],
          custom: {},
        },
      };

      setMessages((prev) => [...prev, newMessage]);

      // Check for @mentions and trigger agents
      if (content.includes("@")) {
        orchestratorRef.current?.handleAgentResponse(
          threadId,
          "user-1",
          content,
        );
      }
    },
    [],
  );

  const value: SpaceRuntimeContextValue = {
    runtime,
    orchestrator: orchestratorRef.current!,
    messages,
    participants,
    sendMessage,
    isAgentBusy,
  };

  return (
    <SpaceRuntimeContext.Provider value={value}>
      {children}
    </SpaceRuntimeContext.Provider>
  );
}

export function useSpaceRuntime() {
  const context = useContext(SpaceRuntimeContext);
  if (!context) {
    throw new Error("useSpaceRuntime must be used within SpaceRuntimeProvider");
  }
  return context;
}
