import { Hash, Users, Bot } from "lucide-react";
import type { Channel } from "@assistant-ui/core";

interface ChannelHeaderProps {
  channel: Channel | null | undefined;
  participantCount: number;
  isAgentBusy: boolean;
}

export function ChannelHeader({
  channel,
  participantCount,
  isAgentBusy,
}: ChannelHeaderProps) {
  if (!channel) {
    return (
      <div className="flex h-14 items-center border-gray-200 border-b px-4">
        <p className="text-gray-500">Select a channel</p>
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center justify-between border-gray-200 border-b px-4">
      <div className="flex items-center gap-2">
        <Hash className="h-5 w-5 text-gray-400" />
        <h1 className="font-bold text-lg">{channel.name}</h1>
        {isAgentBusy && (
          <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-600">
            <Bot className="h-3 w-3" />
            Agent working...
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-gray-500 text-sm">
        <Users className="h-4 w-4" />
        <span>{participantCount}</span>
      </div>
    </div>
  );
}
