import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { useSpaceRuntime } from "../SpaceRuntimeProvider";

interface MessageInputProps {
  channelId: string;
  threadId: string;
}

export function MessageInput({ channelId, threadId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isAgentBusy } = useSpaceRuntime();

  const handleSubmit = () => {
    if (!content.trim() || !channelId) return;

    sendMessage(content, channelId, threadId);
    setContent("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-gray-200 border-t p-4">
      <div
        className={`flex items-end gap-2 rounded-lg border bg-white p-3 transition-colors ${
          isFocused ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isAgentBusy
              ? "Agent is thinking..."
              : "Type a message... Use @ to mention an agent"
          }
          disabled={isAgentBusy}
          className="max-h-[200px] flex-1 resize-none text-sm outline-none disabled:opacity-50"
          rows={1}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || isAgentBusy}
          className={`rounded-md p-2 transition-colors ${
            content.trim() && !isAgentBusy
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-gray-400 text-xs">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
