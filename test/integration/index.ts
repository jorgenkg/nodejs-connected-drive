import "./api-tests.js";
import "./deepMerge-tests.js";
import { run } from "../test-helpers/test-fn.js";

try {
  run();
}
catch(error) {
  // eslint-disable-next-line no-console
  console.error(error);
}
