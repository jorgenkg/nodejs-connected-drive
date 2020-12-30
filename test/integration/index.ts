import "./api-tests.js";
import { run } from "../test-helpers/test-fn.js";

try {
  run();
}
catch(error) {
  console.error(error);
}
