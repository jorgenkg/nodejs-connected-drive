/* eslint-disable @typescript-eslint/no-explicit-any */
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
