"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace ChannelPrimitiveThreadList {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div>;
}

export const ChannelPrimitiveThreadList = forwardRef<
  ChannelPrimitiveThreadList.Element,
  ChannelPrimitiveThreadList.Props
>((props, ref) => {
  return <Primitive.div {...props} ref={ref} />;
});

ChannelPrimitiveThreadList.displayName = "ChannelPrimitive.ThreadList";
