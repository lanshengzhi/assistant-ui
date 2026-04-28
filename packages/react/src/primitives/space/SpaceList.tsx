"use client";

import { Primitive } from "../../utils/Primitive";
import {
  type ComponentRef,
  forwardRef,
  type ComponentPropsWithoutRef,
  createContext,
  useContext,
} from "react";

const SpaceContext = createContext<{ spaceId?: string } | null>(null);

export const useSpaceContext = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error(
      "Space components must be used within a SpacePrimitive.Root",
    );
  }
  return context;
};

export namespace SpacePrimitiveList {
  export type Element = ComponentRef<typeof Primitive.div>;
  export type Props = ComponentPropsWithoutRef<typeof Primitive.div>;
}

export const SpacePrimitiveList = forwardRef<
  SpacePrimitiveList.Element,
  SpacePrimitiveList.Props
>((props, ref) => {
  return <Primitive.div {...props} ref={ref} />;
});

SpacePrimitiveList.displayName = "SpacePrimitive.List";
