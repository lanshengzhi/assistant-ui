"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace MessagePrimitiveReactions {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Reaction = {
    emoji: string;
    participantIds: string[];
    count: number;
  };
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    reactions: readonly Reaction[];
    onAddReaction?: (emoji: string) => void;
    onRemoveReaction?: (emoji: string) => void;
  };
}

export const MessagePrimitiveReactions = forwardRef<
  MessagePrimitiveReactions.Element,
  MessagePrimitiveReactions.Props
>(({ reactions, onAddReaction, onRemoveReaction, ...props }, ref) => {
  return (
    <Primitive.div {...props} ref={ref}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className="aui-reaction"
          onClick={() => onRemoveReaction?.(reaction.emoji)}
        >
          <span className="aui-reaction-emoji">{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="aui-reaction-count">{reaction.count}</span>
          )}
        </button>
      ))}
    </Primitive.div>
  );
});

MessagePrimitiveReactions.displayName = "MessagePrimitive.Reactions";
