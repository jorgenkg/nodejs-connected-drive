import {
  compose,
  test
} from "../test-helpers/index.js";
import { deepMerge } from "../../lib/misc/deepMerge.js";

test("It should merge vanilla single-level objects", compose(
  t => {
    const A = { foo: 1 };
    const B = { bar: 2 };
    const result = deepMerge(A, B);
    t.deepEqual(result, {
      foo: 1,
      bar: 2
    }, "Expect the combined object to reflect mock data");
  }
));

test("It should overwrite properties using the last seen value", compose(
  t => {
    const A = { foo: 1 };
    const B = { foo: 2 };
    const result = deepMerge(A, B);
    t.deepEqual(result, { foo: 2 }, "Expect the combined object to reflect mock data");
  }
));

test("It should deep merge properties", compose(
  t => {
    const A = { foo: { bar: 1 } };
    const B = { foo: { baz: 2 } };
    const result = deepMerge(A, B);
    t.deepEqual(result, { foo: { bar: 1, baz: 2 } }, "Expect the combined object to reflect mock data");
  }
));

test("It should deep merge properties and overwrite using the last seen value", compose(
  t => {
    const A = { foo: { bar: 0 } };
    const B = { foo: { bar: { baz: 1 } } };
    const result = deepMerge(A, B);
    t.deepEqual(result, { foo: { bar: { baz: 1 } } }, "Expect the combined object to reflect mock data");
  }
));
