"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace ParticipantPrimitiveThinkingIndicator {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    /** Whether to show the thinking animation */
    isThinking: boolean;
  };
}

export const ParticipantPrimitiveThinkingIndicator = forwardRef<
  ParticipantPrimitiveThinkingIndicator.Element,
  ParticipantPrimitiveThinkingIndicator.Props
>(({ isThinking, ...props }, ref) => {
  if (!isThinking) return null;

  return (
    <Primitive.div
      {...props}
      ref={ref}
      className="aui-thinking-indicator"
      aria-label="Agent is thinking..."
    >
      <div className="aui-thinking-dots">
        <span className="aui-dot" />
        <span className="aui-dot" />
        <span className="aui-dot" />
      </div>
      <span className="aui-thinking-text">Thinking...</span>
    </Primitive.div>
  );
});

ParticipantPrimitiveThinkingIndicator.displayName = "ParticipantPrimitive.ThinkingIndicator";
