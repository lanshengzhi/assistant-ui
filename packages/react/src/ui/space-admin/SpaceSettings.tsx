"use client";

import { useId, useState } from "react";

export type SpaceSettingsProps = {
  name: string;
  description?: string;
  onUpdate: (settings: { name: string; description: string }) => void;
};

export function SpaceSettings({
  name,
  description = "",
  onUpdate,
}: SpaceSettingsProps) {
  const [formName, setFormName] = useState(name);
  const [formDescription, setFormDescription] = useState(description);
  const nameId = useId();
  const descId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ name: formName, description: formDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="aui-space-settings">
      <div className="aui-form-group">
        <label htmlFor={nameId}>Space Name</label>
        <input
          id={nameId}
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
      </div>

      <div className="aui-form-group">
        <label htmlFor={descId}>Description</label>
        <textarea
          id={descId}
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
        />
      </div>

      <button type="submit" className="aui-btn-primary">
        Save Changes
      </button>
    </form>
  );
}
