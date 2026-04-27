"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

export namespace SpacePrimitiveRoot {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div>;
}

export const SpacePrimitiveRoot = forwardRef<
  SpacePrimitiveRoot.Element,
  SpacePrimitiveRoot.Props
>((props, ref) => {
  return <Primitive.div {...props} ref={ref} />;
});

SpacePrimitiveRoot.displayName = "SpacePrimitive.Root";
