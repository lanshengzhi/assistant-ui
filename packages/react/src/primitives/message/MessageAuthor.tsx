"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace MessagePrimitiveAuthor {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    participantId: string;
    displayName?: string;
    avatar?: string;
    status?: "online" | "busy" | "away" | "offline";
  };
}

export const MessagePrimitiveAuthor = forwardRef<
  MessagePrimitiveAuthor.Element,
  MessagePrimitiveAuthor.Props
>(({ participantId, displayName, avatar, status, ...props }, ref) => {
  return (
    <Primitive.div {...props} ref={ref} data-participant-id={participantId} data-status={status}>
      {avatar && <img src={avatar} alt={displayName || participantId} className="aui-author-avatar" />}
      <span className="aui-author-name">{displayName || participantId}</span>
      {status && <span className={`aui-author-status aui-status-${status}`} />}
    </Primitive.div>
  );
});

MessagePrimitiveAuthor.displayName = "MessagePrimitive.Author";
