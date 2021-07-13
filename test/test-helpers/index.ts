import { default as debug } from "debug";
import { RemoteService } from "../../lib/enums/RemoteService.js";
import type { Configuration } from "../../lib/@types/Configuration";

export {
  compose,
  withApi,
  withMockedConnectedDriveApi
} from "./compose-helpers.js";

export const defaults: Configuration<true> = {
  connectedDrive: {
    remoteServiceExecutionTimeoutMs: 1000 * 60 * 2,
    pollIntervalMs: 3000,
    auth: {
      host: "http://localhost:8080",
      // host: "https://customer.bmwgroup.com",
      endpoints: { authenticate: "/gcdm/oauth/authenticate" },
      client_id: "dbf0a542-ebd1-4ff0-a9a7-55172fbfce35",
      redirect_uri: "https://www.bmw-connecteddrive.com/app/static/external-dispatch.html",
      state: "eyJtYXJrZXQiOiJubyIsImxhbmd1YWdlIjoibm8iLCJkZXN0aW5hdGlvbiI6ImxhbmRpbmdQYWdlIiwicGFyYW1ldGVycyI6Int9In0",
      response_type: "token",
      scope: "authenticate_user fupo",
    },
    host: "http://localhost:8080",
    // host: "https://www.bmw-connecteddrive.no",
    port: 8080,
    endpoints: {
      executeRemoteServices: "/remoteservices/rsapi/v1/{vehicleVin}/{serviceType}",
      statusRemoteServices: "/remoteservices/rsapi/v1/{vehicleVin}/state/execution",
      getVehicles: "/api/me/vehicles/v2?all=true&brand=BM",
      getStatusOfAllVehicles: "/api/me/mapping/v4/status?brand=BM",
      getVehicleDetails: "/api/vehicle/service/v1/{vehicleVin}",
      getStatusOfAllVehiclesRemoteService: "/api/me/vehicles/v2/{vehicleVin}/serviceExecutionStatus?serviceType={serviceType}",
      getVehicleTechnicalDetails: "/api/vehicle/dynamic/v1/{vehicleVin}",
    }
  },
  logger: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    debug: (msg: string, obj?: Record<string, unknown>) => obj ? debug("connecteddrive:debug")("%s %o", msg, obj) : debug("connecteddrive:debug")("%s", msg),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    info: (msg: string, obj?: Record<string, unknown>) => obj ? debug("connecteddrive:info")("%s %o", msg, obj) : debug("connecteddrive:info")("%s", msg),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    warn: (msg: string, obj?: Record<string, unknown>) => obj ? debug("connecteddrive:warn")("%s %o", msg, obj) : debug("connecteddrive:warn")("%s", msg),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    error: (msg: string, obj?: Record<string, unknown>) => obj ? debug("connecteddrive:error")("%s %o", msg, obj) : debug("connecteddrive:error")("%s", msg),
  },
  clock: {
    setInterval,
    setTimeout,
    clearInterval,
    clearTimeout,
    Date,
  },
  mockData: {
    username: "john@example.com",
    password: "super-secret",
    vin: "123456789",
    currentCommand: RemoteService.DOOR_LOCK,
    eventId: "xyz"
  }
};
