import type { Space } from "../../types/space";

export type SpaceState = {
  readonly space: Space | null;
  readonly isLoading: boolean;
};

export type SpaceMethods = {
  /**
   * Get the current state of the space.
   */
  getState(): SpaceState;
  /**
   * Create a new space.
   */
  create(name: string, description?: string): void;
  /**
   * Load an existing space by ID.
   */
  load(spaceId: string): Promise<void>;
  /**
   * Rename the space.
   */
  rename(name: string): void;
  /**
   * Update space description.
   */
  setDescription(description: string): void;
};

export type SpaceMeta = {
  source: "root";
  query: { type: "space" };
};

export type SpaceEvents = {
  "space.loaded": { spaceId: string };
  "space.created": { spaceId: string };
  "space.updated": { spaceId: string };
};

export type SpaceClientSchema = {
  methods: SpaceMethods;
  meta: SpaceMeta;
  events: SpaceEvents;
};
