import { Hash, ChevronDown, Plus } from "lucide-react";
import type { Space, Participant } from "@assistant-ui/core";

interface SidebarProps {
  space: Space | null;
  participants: Participant[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

export function Sidebar({
  space,
  participants,
  selectedChannelId,
  onSelectChannel,
}: SidebarProps) {
  if (!space) return null;

  const channels = space.channels.filter((c) => !c.archived);
  const _onlineParticipants = participants.filter(
    (p) => p.status === "online" || p.status === "busy",
  );

  return (
    <div className="flex w-64 flex-col bg-slate-900 text-white">
      {/* Space Header */}
      <div className="border-slate-700 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="truncate font-bold text-lg">{space.name}</h2>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
        <p className="mt-1 truncate text-slate-400 text-xs">
          {space.description}
        </p>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
              Channels
            </span>
            <Plus className="h-4 w-4 cursor-pointer text-slate-400 hover:text-white" />
          </div>

          {channels.map((channel) => (
            <button
              type="button"
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                selectedChannelId === channel.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Hash className="h-4 w-4 text-slate-400" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
              Direct Messages
            </span>
            <Plus className="h-4 w-4 cursor-pointer text-slate-400 hover:text-white" />
          </div>

          {participants.map((participant) => (
            <button
              type="button"
              key={participant.id}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-slate-300 text-sm transition-colors hover:bg-slate-800 hover:text-white"
            >
              <div className="relative">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs">
                  {participant.displayName[0]}
                </div>
                <div
                  className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${
                    participant.status === "online"
                      ? "bg-green-500"
                      : participant.status === "busy"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                  }`}
                />
              </div>
              <span className="truncate">{participant.displayName}</span>
              {participant.role === "agent" && (
                <span className="ml-auto text-slate-500 text-xs">BOT</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-slate-700 border-t p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-semibold text-sm">
            U
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">You</p>
            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
