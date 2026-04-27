"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace MessagePrimitiveReply {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    replyCount: number;
    onShowReplies?: () => void;
  };
}

export const MessagePrimitiveReply = forwardRef<
  MessagePrimitiveReply.Element,
  MessagePrimitiveReply.Props
>(({ replyCount, onShowReplies, ...props }, ref) => {
  if (replyCount === 0) return null;

  return (
    <Primitive.div {...props} ref={ref}>
      <button
        className="aui-reply-button"
        onClick={onShowReplies}
      >
        {replyCount === 1 ? "1 reply" : `${replyCount} replies`}
      </button>
    </Primitive.div>
  );
});

MessagePrimitiveReply.displayName = "MessagePrimitive.Reply";
