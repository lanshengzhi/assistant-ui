"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace ChannelPrimitiveList {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div>;
}

export const ChannelPrimitiveList = forwardRef<
  ChannelPrimitiveList.Element,
  ChannelPrimitiveList.Props
>((props, ref) => {
  return <Primitive.div {...props} ref={ref} />;
});

ChannelPrimitiveList.displayName = "ChannelPrimitive.List";
