"use client";

import { useState } from "react";

export type SpaceSettingsProps = {
  name: string;
  description?: string;
  onUpdate: (settings: { name: string; description: string }) => void;
};

export function SpaceSettings({ name, description = "", onUpdate }: SpaceSettingsProps) {
  const [formName, setFormName] = useState(name);
  const [formDescription, setFormDescription] = useState(description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ name: formName, description: formDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="aui-space-settings">
      <div className="aui-form-group">
        <label htmlFor="space-name">Space Name</label>
        <input
          id="space-name"
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
      </div>

      <div className="aui-form-group">
        <label htmlFor="space-description">Description</label>
        <textarea
          id="space-description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
        />
      </div>

      <button type="submit" className="aui-btn-primary">Save Changes</button>
    </form>
  );
}
