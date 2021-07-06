import { default as debug } from "debug";
import { RemoteService } from "../@types/interfaces";

export type Configuration<Test extends boolean = false> = {
  connectedDrive: {
    remoteServiceExecutionTimeoutMs: number;
    pollIntervalMs: number;
    auth: {
      host: string;
      state: "eyJtYXJrZXQiOiJubyIsImxhbmd1YWdlIjoibm8iLCJkZXN0aW5hdGlvbiI6ImxhbmRpbmdQYWdlIiwicGFyYW1ldGVycyI6Int9In0"
      endpoints: { authenticate: string },
      client_id: string;
      redirect_uri: string;
      response_type: string;
      scope: string;
    };
    host: string;
    port: Test extends false ? undefined : number;
    endpoints: {
      executeRemoteServices: string;
      statusRemoteServices: string;
      getVehicles: string;
      getStatusOfAllVehicles: string;
      getVehicleDetails: string;
      getStatusOfAllVehiclesRemoteService: string;
    };
  };
  logger: {
    debug: (msg: string, obj?: Record<string, unknown>) => void,
    info: (msg: string, obj?: Record<string, unknown>) => void,
    warn: (msg: string, obj?: Record<string, unknown>) => void,
    error: (msg: string, obj?: Record<string, unknown>) => void,
  };
  clock: {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
    Date: typeof Date;
  };
  mockData: Test extends false ? undefined : {
    username: string;
    password: string;
    vin: string;
    currentCommand: RemoteService;
    eventId: string;
  };
}


export default {
  connectedDrive: {
    remoteServiceExecutionTimeoutMs: 60000,
    pollIntervalMs: 3000,
    auth: {
      host: "https://customer.bmwgroup.com",
      state: "eyJtYXJrZXQiOiJubyIsImxhbmd1YWdlIjoibm8iLCJkZXN0aW5hdGlvbiI6ImxhbmRpbmdQYWdlIiwicGFyYW1ldGVycyI6Int9In0",
      endpoints: { authenticate: "/gcdm/oauth/authenticate" },
      client_id: "dbf0a542-ebd1-4ff0-a9a7-55172fbfce35",
      redirect_uri: "https://www.bmw-connecteddrive.com/app/static/external-dispatch.html",
      response_type: "token",
      scope: "authenticate_user vehicle_data remote_services",
    },
    host: "https://b2vapi.bmwgroup.com",
    endpoints: {
      executeRemoteServices: "/remoteservices/rsapi/v1/{vehicleVin}/{serviceType}",
      statusRemoteServices: "/remoteservices/rsapi/v1/{vehicleVin}/state/execution",
      getVehicles: "/api/me/vehicles/v2?all=true&brand=BM",
      getStatusOfAllVehicles: "/api/me/mapping/v4/status?brand=BM",
      getVehicleDetails: "/api/vehicle/service/v1/{vehicleVin}",
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
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    setInterval: global.setInterval,
    clearInterval: global.clearInterval,
    Date: Date
  }
} as Configuration;
