/** Space types for collaborative workspace */

export type Channel = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly archived: boolean;
  readonly createdAt: Date;
};

export type Space = {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
  readonly channels: readonly Channel[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
