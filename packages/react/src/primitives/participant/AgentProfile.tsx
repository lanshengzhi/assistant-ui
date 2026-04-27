"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace ParticipantPrimitiveAgentProfile {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    displayName: string;
    avatar?: string;
    status: "online" | "busy" | "away" | "offline";
    capabilities?: readonly string[];
    thinkingSteps?: readonly { id: string; message: string; timestamp: number }[];
  };
}

export const ParticipantPrimitiveAgentProfile = forwardRef<
  ParticipantPrimitiveAgentProfile.Element,
  ParticipantPrimitiveAgentProfile.Props
>(({ displayName, avatar, status, capabilities, thinkingSteps, ...props }, ref) => {
  return (
    <Primitive.div {...props} ref={ref} className="aui-agent-profile">
      <div className="aui-profile-header">
        {avatar ? (
          <img src={avatar} alt={displayName} className="aui-profile-avatar" />
        ) : (
          <div className="aui-avatar-placeholder-large">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="aui-profile-info">
          <h3 className="aui-profile-name">{displayName}</h3>
          <span className={`aui-status-badge aui-status-${status}`}>
            {status}
          </span>
        </div>
      </div>

      {capabilities && capabilities.length > 0 && (
        <div className="aui-profile-section">
          <h4>Capabilities</h4>
          <ul className="aui-capabilities-list">
            {capabilities.map((cap) => (
              <li key={cap}>{cap}</li>
            ))}
          </ul>
        </div>
      )}

      {thinkingSteps && thinkingSteps.length > 0 && (
        <div className="aui-profile-section">
          <h4>Thinking History</h4>
          <div className="aui-thinking-steps">
            {thinkingSteps.map((step) => (
              <div key={step.id} className="aui-thinking-step">
                <span className="aui-thinking-time">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
                <p>{step.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Primitive.div>
  );
});

ParticipantPrimitiveAgentProfile.displayName = "ParticipantPrimitive.AgentProfile";
