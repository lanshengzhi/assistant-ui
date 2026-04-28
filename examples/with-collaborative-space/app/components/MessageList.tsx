import { format } from "date-fns";
import type { SpaceThreadMessage, Participant } from "@assistant-ui/core";
import { MessageSquare, Bot } from "lucide-react";

interface MessageListProps {
  messages: SpaceThreadMessage[];
  participants: Participant[];
  onThreadClick: (threadId: string) => void;
}

export function MessageList({
  messages,
  participants,
  onThreadClick,
}: MessageListProps) {
  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-gray-400">
          <MessageSquare className="mb-4 h-12 w-12" />
          <p className="font-medium text-lg">No messages yet</p>
          <p className="text-sm">Start a conversation or @mention an agent</p>
        </div>
      ) : (
        messages.map((message) => {
          const participant = getParticipant(message.participantId);
          const isAgent = participant?.role === "agent";

          return (
            <div
              key={message.id}
              className={`flex gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 ${
                isAgent ? "bg-blue-50/50" : ""
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm ${
                    isAgent
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {isAgent ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    participant?.displayName[0] || "?"
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {participant?.displayName || "Unknown"}
                  </span>
                  {isAgent && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 text-xs">
                      AGENT
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">
                    {format(message.createdAt, "h:mm a")}
                  </span>
                </div>

                <div className="whitespace-pre-wrap text-gray-800 text-sm">
                  {message.content.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null,
                  )}
                </div>

                {/* Actions */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onThreadClick(message.id)}
                    className="flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Reply in thread
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
