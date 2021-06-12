import * as tape from "tape";

const tests = [] as (() => void)[];

export function run(): void {
  for(const test of tests) {
    test();
  }
}


const testConstructorDecorator = (
  testConstructor: typeof tape | typeof tape.only | typeof tape.skip
) => (description: string, testFn: (t: tape.Test) => Promise<void>) => {
  tests.push(() => {
    testConstructor(description, t => {
      testFn(t)
        .then(() => t.end())
        .catch(error => {
          t.end(error);
          process.exit(1);
        });

    });
  });
};

/*
 * This is a test constructor that differs slightly from that which Tape provides by default. It
 * assumes that your test is an async function / returns a promise and will automatically invoke
 * end() for you, in addition to handling uncaught exceptions. In addition, it will defer execution
 * until run() is invoked. This allows test files to be loaded asynchronously.
 */
export const test = Object.assign(testConstructorDecorator(tape), {
  only: testConstructorDecorator(tape.only),
  skip: testConstructorDecorator(tape.skip)
});
