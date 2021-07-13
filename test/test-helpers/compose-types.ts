/* eslint-disable @typescript-eslint/no-explicit-any */
import * as tape from "tape";

/** An async function performing test setup. The function must await next() before returning */
export type Middleware<T = undefined> =
  (
    next: T extends undefined ? (() => Promise<void>) : (nextedValue: T) => Promise<void>
  ) => Promise<void>;

/** Remove specific Tuple entries/type in-order. */
type RemoveGenericFromTuple<T extends any[], E> =
  T extends [infer u, ...infer v] ?
    u extends E ? RemoveGenericFromTuple<v, E> : [u, ...RemoveGenericFromTuple<v, E>] :
    [];

/** Maps an array of Middleware<T> functions and produce a tuple of the variadic T types */
type GetReturnTypesFromMiddlewares<T extends Array<Middleware<any>>> =
  T extends [infer u, ...infer v] ?
    [
      u extends Middleware<infer r> ? r : never,
      ...(v extends Array<Middleware<any>> ? GetReturnTypesFromMiddlewares<v> : never)
    ] : [];

/** The actual test handler used to execute a set of Tape tests. */
type TestHandler<T extends Array<Middleware<any>>> =
  (...args: [
    ...RemoveGenericFromTuple<GetReturnTypesFromMiddlewares<T>, undefined>,
    tape.Test
  ]) => Promise<void> | void;

/** Helper type for the recursive test composing function. This type collects and combines middleware types and feed them into the test handler fn. */
export type TestComposer = <T extends Array<Middleware<any>>>(
  ...args: [...T, TestHandler<T>]
) => (t: tape.Test) => Promise<void>;
