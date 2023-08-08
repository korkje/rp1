import type { Context } from "../lib/context.ts";

export type Skip = (context: Context) => boolean | Promise<boolean>;

export const noSkip: Skip = () => false;

export default Skip;
