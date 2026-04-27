"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace ParticipantPrimitiveAvatar {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div> & {
    displayName: string;
    avatar?: string;
    status?: "online" | "busy" | "away" | "offline";
    onClick?: () => void;
  };
}

export const ParticipantPrimitiveAvatar = forwardRef<
  ParticipantPrimitiveAvatar.Element,
  ParticipantPrimitiveAvatar.Props
>(({ displayName, avatar, status, onClick, ...props }, ref) => {
  return (
    <Primitive.div
      {...props}
      ref={ref}
      className="aui-participant-avatar"
      data-status={status}
      onClick={onClick}
    >
      {avatar ? (
        <img src={avatar} alt={displayName} />
      ) : (
        <div className="aui-avatar-placeholder">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {status && <span className={`aui-status-indicator aui-status-${status}`} />}
    </Primitive.div>
  );
});

ParticipantPrimitiveAvatar.displayName = "ParticipantPrimitive.Avatar";
