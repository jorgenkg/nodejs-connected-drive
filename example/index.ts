import * as assert from "assert";
import { ConnectedDrive } from "../index.js";
import type { GetVehiclesResponse } from "../lib/@types/GetVehiclesResponse.js";

(async() => {
  assert(process.env.USERNAME, "Expect USERNAME to be defined");
  assert(process.env.PASSWORD, "Expect PASSWORD to be defined");

  const api = new ConnectedDrive(process.env.USERNAME, process.env.PASSWORD);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vehicles: GetVehiclesResponse = await api.getVehicles();
})()
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
