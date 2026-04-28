/** CLI Daemon HTTP Client */

import type {
  AgentInvocationRequest,
  AgentStreamEvent,
  DaemonHealthStatus,
} from "./protocol";

export type CLIDaemonClientOptions = {
  port: number;
  authToken?: string;
  timeout?: number;
  baseUrl?: string;
};

export type CLIDaemonClient = {
  /** Check if daemon is reachable */
  health(): Promise<DaemonHealthStatus>;
  /** Invoke agent with streaming response */
  invoke(
    request: AgentInvocationRequest,
    callbacks: {
      onThinkingStep: (step: {
        id: string;
        message: string;
        timestamp: number;
      }) => void;
      onMessage: (content: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    },
  ): Promise<void>;
  /** Cancel ongoing invocation */
  cancel(): void;
};

export class HttpCLIDaemonClient implements CLIDaemonClient {
  private _abortController: AbortController | null = null;
  private _options: Required<Pick<CLIDaemonClientOptions, "port" | "timeout">> &
    Omit<CLIDaemonClientOptions, "port" | "timeout">;

  constructor(options: CLIDaemonClientOptions) {
    this._options = {
      port: options.port,
      timeout: options.timeout ?? 60000,
      baseUrl: options.baseUrl ?? `http://localhost:${options.port}`,
      authToken: options.authToken,
    };
  }

  async health(): Promise<DaemonHealthStatus> {
    const response = await fetch(`${this._options.baseUrl}/health`, {
      method: "GET",
      headers: this._getHeaders(),
    });

    if (!response.ok) {
      return { status: "unhealthy" };
    }

    const data = await response.json();
    return {
      status: "healthy",
      version: data.version,
      uptime: data.uptime,
    };
  }

  async invoke(
    request: AgentInvocationRequest,
    callbacks: {
      onThinkingStep: (step: {
        id: string;
        message: string;
        timestamp: number;
      }) => void;
      onMessage: (content: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    },
  ): Promise<void> {
    this._abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      this._abortController?.abort(new Error("Agent invocation timeout"));
    }, this._options.timeout);

    try {
      const response = await fetch(`${this._options.baseUrl}/invoke`, {
        method: "POST",
        headers: {
          ...this._getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Agent invocation failed: ${response.status} ${response.statusText}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (buffer.length > MAX_BUFFER_SIZE) {
          throw new Error(
            `SSE buffer exceeded maximum size (${MAX_BUFFER_SIZE} bytes)`,
          );
        }

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            try {
              const event: AgentStreamEvent = JSON.parse(data);
              this._handleEvent(event, callbacks);
            } catch (_e) {
              // Ignore parse errors for malformed events
            }
          }
        }
      }

      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        callbacks.onError(new Error("Agent invocation was cancelled"));
      } else {
        callbacks.onError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }

  cancel(): void {
    this._abortController?.abort();
  }

  private _getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
    };
    if (this._options.authToken) {
      headers.Authorization = `Bearer ${this._options.authToken}`;
    }
    return headers;
  }

  private _handleEvent(
    event: AgentStreamEvent,
    callbacks: {
      onThinkingStep: (step: {
        id: string;
        message: string;
        timestamp: number;
      }) => void;
      onMessage: (content: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    },
  ): void {
    switch (event.type) {
      case "thinking-step":
        callbacks.onThinkingStep(event.step);
        break;
      case "message":
        callbacks.onMessage(event.content);
        break;
      case "complete":
        callbacks.onComplete();
        break;
      case "error":
        callbacks.onError(new Error(event.error));
        break;
    }
  }
}
