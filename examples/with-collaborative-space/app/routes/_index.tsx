import { useState } from "react";
import { useSpaceRuntime } from "../SpaceRuntimeProvider";
import { Sidebar } from "../components/Sidebar";
import { ChannelHeader } from "../components/ChannelHeader";
import { MessageList } from "../components/MessageList";
import { MessageInput } from "../components/MessageInput";
import { ThreadPanel } from "../components/ThreadPanel";

export default function Index() {
  const { runtime, messages, participants, isAgentBusy } = useSpaceRuntime();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    runtime.space?.channels[0]?.id || null,
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showThreadPanel, setShowThreadPanel] = useState(false);

  const selectedChannel = selectedChannelId
    ? runtime.space?.channels.find((c) => c.id === selectedChannelId)
    : null;

  const channelMessages = messages.filter((_m) => {
    // In a real app, messages would be tagged with channel/thread
    // For demo, show all messages
    return true;
  });

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar - Spaces & Channels */}
      <Sidebar
        space={runtime.space}
        participants={participants}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
      />

      {/* Main Content - Messages */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChannelHeader
          channel={selectedChannel}
          participantCount={participants.length}
          isAgentBusy={isAgentBusy}
        />

        <MessageList
          messages={channelMessages}
          participants={participants}
          onThreadClick={(threadId) => {
            setSelectedThreadId(threadId);
            setShowThreadPanel(true);
          }}
        />

        <MessageInput
          channelId={selectedChannelId || ""}
          threadId={selectedThreadId || "main"}
        />
      </div>

      {/* Right Panel - Thread / Agent Profile */}
      {showThreadPanel && (
        <ThreadPanel
          threadId={selectedThreadId}
          onClose={() => setShowThreadPanel(false)}
        />
      )}
    </div>
  );
}
