/* eslint-disable @typescript-eslint/no-explicit-any */
import tape from "tape";

/** An async function performing test setup. The function must await next() before returning */
export type Middleware<T> = (next: T extends undefined ? (() => Promise<void>) : (arg0: T) => Promise<void>) => Promise<void>;

type RemoveGenericFromTuple<T extends any[], E> = T extends [infer u, ...infer v] ?
  u extends E ?
    RemoveGenericFromTuple<v, E> :
    [u, ...RemoveGenericFromTuple<v, E>] :
    [];

type TestFn<T extends any[]> = (...arg: [...RemoveGenericFromTuple<T, undefined>, tape.Test]) => Promise<void> | void;

export type TestSetup = {
  <T1> (middleware1: Middleware<T1>, testFn: TestFn<[T1]>): (t: tape.Test) => Promise<void>;
  <T1, T2> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, testFn: TestFn<[T1, T2]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, testFn: TestFn<[T1, T2, T3]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, testFn: TestFn<[T1, T2, T3, T4]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, testFn: TestFn<[T1, T2, T3, T4, T5]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, testFn: TestFn<[T1, T2, T3, T4, T5, T6]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6, T7> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, middleware7: Middleware<T7>, testFn: TestFn<[T1, T2, T3, T4, T5, T6, T7]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6, T7, T8> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, middleware7: Middleware<T7>, middleware8: Middleware<T8>, testFn: TestFn<[T1, T2, T3, T4, T5, T6, T7, T8]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, middleware7: Middleware<T7>, middleware8: Middleware<T8>, middleware9: Middleware<T9>, testFn: TestFn<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, middleware7: Middleware<T7>, middleware8: Middleware<T8>, middleware9: Middleware<T9>, middleware10: Middleware<T10>, testFn: TestFn<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>): (t: tape.Test) => Promise<void>;
  <T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> (middleware1: Middleware<T1>, middleware2: Middleware<T2>, middleware3: Middleware<T3>, middleware4: Middleware<T4>, middleware5: Middleware<T5>, middleware6: Middleware<T6>, middleware7: Middleware<T7>, middleware8: Middleware<T8>, middleware9: Middleware<T9>, middleware10: Middleware<T10>, middleware11: Middleware<T11>, testFn: TestFn<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]>): (t: tape.Test) => Promise<void>;
}
