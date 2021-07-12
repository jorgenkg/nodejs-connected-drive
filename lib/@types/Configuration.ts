import { RemoteService } from "../enums/RemoteService";

/** The generic parameter shall be `true` for test cases and omitted (or `false`) in production instantiation.  */
export type Configuration<Test extends boolean = false> = {
  connectedDrive: {
    remoteServiceExecutionTimeoutMs: number;
    pollIntervalMs: number;
    auth: {
      host: string;
      state: "eyJtYXJrZXQiOiJubyIsImxhbmd1YWdlIjoibm8iLCJkZXN0aW5hdGlvbiI6ImxhbmRpbmdQYWdlIiwicGFyYW1ldGVycyI6Int9In0";
      endpoints: { authenticate: string; };
      client_id: string;
      redirect_uri: string;
      response_type: string;
      scope: string;
    };
    host: string;
    port: Test extends false ? never : number;
    endpoints: {
      executeRemoteServices: string;
      statusRemoteServices: string;
      getVehicles: string;
      getStatusOfAllVehicles: string;
      getVehicleDetails: string;
      getStatusOfAllVehiclesRemoteService: string;
      getVehicleTechnicalDetails: string;
    };
  };
  logger: {
    debug: (msg: string, obj?: Record<string, unknown>) => void;
    info: (msg: string, obj?: Record<string, unknown>) => void;
    warn: (msg: string, obj?: Record<string, unknown>) => void;
    error: (msg: string, obj?: Record<string, unknown>) => void;
  };
  clock: {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
    Date: typeof Date;
  };
  mockData: Test extends false ? never : {
    username: string;
    password: string;
    vin: string;
    currentCommand: RemoteService;
    eventId: string;
  };
};
