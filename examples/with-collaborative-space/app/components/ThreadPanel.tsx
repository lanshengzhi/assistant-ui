import { X, MessageSquare } from "lucide-react";

interface ThreadPanelProps {
  threadId: string | null;
  onClose: () => void;
}

export function ThreadPanel({ threadId, onClose }: ThreadPanelProps) {
  return (
    <div className="flex w-80 flex-col border-gray-200 border-l bg-white">
      <div className="flex h-14 items-center justify-between border-gray-200 border-b px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold">Thread</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-gray-500 text-sm">
          Thread view for message {threadId}
        </p>
        <p className="mt-2 text-gray-400 text-xs">
          (Thread functionality will be implemented in the next iteration)
        </p>
      </div>
    </div>
  );
}
