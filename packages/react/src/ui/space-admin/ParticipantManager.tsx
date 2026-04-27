"use client";

import type { Participant } from "@assistant-ui/core";

export type ParticipantManagerProps = {
  participants: readonly Participant[];
  onInvite: (email: string) => void;
  onSetRole: (participantId: string, role: Participant["role"]) => void;
  onRemove: (participantId: string) => void;
};

export function ParticipantManager({
  participants,
  onInvite,
  onSetRole,
  onRemove,
}: ParticipantManagerProps) {
  const [email, setEmail] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim());
      setEmail("");
    }
  };

  return (
    <div className="aui-participant-manager">
      <h3>Participants</h3>

      <form onSubmit={handleInvite} className="aui-invite-form">
        <div className="aui-form-group">
          <input
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="aui-btn-primary">Invite</button>
        </div>
      </form>

      <ul className="aui-participant-list">
        {participants.map((participant) => (
          <li key={participant.id} className={`aui-role-${participant.role}`}>
            <span className="aui-participant-name">{participant.displayName}</span>
            <span className={`aui-status-badge aui-status-${participant.status}`}>
              {participant.status}
            </span>
            <span className="aui-role-badge">{participant.role}</span>

            {participant.role === "human" && (
              <select
                value={participant.role}
                onChange={(e) =>
                  onSetRole(participant.id, e.target.value as Participant["role"])
                }
              >
                <option value="human">Member</option>
                <option value="agent">Agent</option>
              </select>
            )}

            <button onClick={() => onRemove(participant.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
