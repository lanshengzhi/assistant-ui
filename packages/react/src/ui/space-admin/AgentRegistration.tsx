"use client";

import { useState } from "react";

export type AgentRegistrationProps = {
  onRegister: (agent: {
    displayName: string;
    capabilities: string[];
    port: number;
    authToken?: string;
  }) => void;
};

export function AgentRegistration({ onRegister }: AgentRegistrationProps) {
  const [displayName, setDisplayName] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [port, setPort] = useState(8080);
  const [authToken, setAuthToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Agent name is required");
      return;
    }

    if (port < 1 || port > 65535) {
      setError("Port must be between 1 and 65535");
      return;
    }

    onRegister({
      displayName: displayName.trim(),
      capabilities: capabilities.split(",").map((c) => c.trim()).filter(Boolean),
      port,
      authToken: authToken.trim() || undefined,
    });

    setDisplayName("");
    setCapabilities("");
    setPort(8080);
    setAuthToken("");
  };

  return (
    <form onSubmit={handleSubmit} className="aui-agent-registration">
      <h3>Register Agent</h3>

      {error && <p className="aui-error">{error}</p>}

      <div className="aui-form-group">
        <label htmlFor="agent-name">Display Name</label>
        <input
          id="agent-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="CodeReviewAgent"
          required
        />
      </div>

      <div className="aui-form-group">
        <label htmlFor="agent-capabilities">Capabilities (comma-separated)</label>
        <input
          id="agent-capabilities"
          type="text"
          value={capabilities}
          onChange={(e) => setCapabilities(e.target.value)}
          placeholder="code-review, linting, refactoring"
        />
      </div>

      <div className="aui-form-group">
        <label htmlFor="agent-port">Daemon Port</label>
        <input
          id="agent-port"
          type="number"
          value={port}
          onChange={(e) => setPort(Number(e.target.value))}
          min={1}
          max={65535}
          required
        />
      </div>

      <div className="aui-form-group">
        <label htmlFor="agent-token">Auth Token (optional)</label>
        <input
          id="agent-token"
          type="password"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          placeholder="Secret token for daemon authentication"
        />
      </div>

      <button type="submit" className="aui-btn-primary">Register Agent</button>
    </form>
  );
}
