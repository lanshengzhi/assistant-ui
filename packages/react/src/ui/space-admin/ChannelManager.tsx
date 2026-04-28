"use client";

import { useState } from "react";
import type { Channel } from "@assistant-ui/core";

export type ChannelManagerProps = {
  channels: readonly Channel[];
  onCreate: (name: string, description?: string) => void;
  onArchive: (channelId: string) => void;
  onRename: (channelId: string, name: string) => void;
};

export function ChannelManager({
  channels,
  onCreate,
  onArchive,
  onRename,
}: ChannelManagerProps) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newName.trim()) {
      setError("Channel name is required");
      return;
    }

    if (channels.some((c) => c.name === newName.trim())) {
      setError(`Channel "${newName}" already exists`);
      return;
    }

    onCreate(newName.trim(), newDescription.trim() || undefined);
    setNewName("");
    setNewDescription("");
  };

  return (
    <div className="aui-channel-manager">
      <h3>Channels</h3>

      <form onSubmit={handleCreate} className="aui-channel-form">
        <div className="aui-form-group">
          <input
            type="text"
            placeholder="New channel name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button type="submit" className="aui-btn-primary">
            Create
          </button>
        </div>
        {error && <p className="aui-error">{error}</p>}
      </form>

      <ul className="aui-channel-list">
        {channels.map((channel) => (
          <li
            key={channel.id}
            className={channel.archived ? "aui-archived" : ""}
          >
            <span>#{channel.name}</span>
            {!channel.archived && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt("New name:", channel.name);
                    if (name) onRename(channel.id, name);
                  }}
                >
                  Rename
                </button>
                <button type="button" onClick={() => onArchive(channel.id)}>
                  Archive
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
