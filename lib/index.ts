import * as querystring from "querystring";
import * as URL from "url";
import { Configuration, default as DefaultConfiguration } from "./config/default.js";
import {
  GetRemoteServiceStatusResponse,
  GetStatusOfAllVehiclesResponse as GetStatusOfAllVehiclesResponse, GetTechnicalVehicleDetails, GetVehicleDetails, GetVehiclesResponse, RemoteService, RemoteServiceCommand, RemoteServiceExecutionState, StartRemoteServiceResponse
} from "./@types/interfaces";
import got from "got";


export { RemoteService } from "./@types/interfaces";

/**
 * SDK class that expose the Connected Drive API.
 * It is not necessary to call login explicitly. The SDK will lazily call `login()` to (re)authenticate when necessary.
 */
export class ConnectedDriveApi {
  readonly #configuration: Configuration<boolean>;
  readonly #username: string;
  readonly #password: string;
  #sessionExpiresAt?: Date;
  #accessToken?: string;

  constructor(
    /** Required. The Connected Drive username */
    username: string,
    /** Required. The Connected Drive username */
    password: string,
    /** Optional. Override the default configuration. */
    configuration?: Configuration<true> | Configuration<false>
  ) {
    this.#configuration = { ...DefaultConfiguration, ...configuration };
    this.#username = username;
    this.#password = password;
  }

  /** Send a REST request to the Connected Drive API */
  async #httpRequest<T>({
    path,
    method = "GET",
    body,
    forceLogin = false,
    headers
  }: {
    path: string;
    method?: "POST" | "GET";
    body?: string;
    headers?: Record<string, string>;
    forceLogin?: boolean;
  }): Promise<T> {
    if(forceLogin || !this.#sessionExpiresAt || (this.#sessionExpiresAt.valueOf() - this.#configuration.clock.Date.now()) < 1000 * 60) {
      await this.login();
    }

    if(!this.#accessToken) {
      throw new Error("No access token available");
    }

    const { connectedDrive: { host } } = this.#configuration;

    try {
      this.#configuration.logger.debug(`${method} ${host}${path} ${forceLogin ? "(retry)" : ""}`);
      const response = await got(
        URL.resolve(host, path),
        {
          method,
          headers: {
            ...headers,
            authorization: `Bearer ${this.#accessToken}`,
            ["user-agent"]: "nodejs-connected-drive",
          },
          body,
          retry: {
            limit: 2,
            statusCodes: [404, 503, 504],
          },
        }
      );
      this.#configuration.logger.debug(`${method} ${host}${path} response status ${response.statusCode}`, { body: JSON.parse(response.body) });
      return JSON.parse(response.body) as T;
    }
    catch(error) {
      if(
        error instanceof got.HTTPError &&
        error.response.statusCode === 401 &&
        !forceLogin
      ) {
        return await this.#httpRequest({
          path, method, body, forceLogin: true
        });
      }
      if(error instanceof got.HTTPError) {
        throw new Error(`HTTP ${method} ${path}: Status: ${error.response.statusCode}. Response body: ${error.response.rawBody.toString()}`);
      }
      else {
        throw error;
      }
    }
  }

  /** Authenticate with the Connected Drive API and store the resulting access_token on 'this'. This function is also called lazily by the SDK when necessary. */
  async login(): Promise<void> {
    const { connectedDrive: { auth } } = this.#configuration;

    const response = await got(
      URL.resolve(auth.host, auth.endpoints.authenticate),
      {
        method: "POST",
        followRedirect: false,
        form: {
          client_id: auth.client_id,
          redirect_uri: auth.redirect_uri,
          response_type: auth.response_type,
          scope: auth.scope,
          username: this.#username,
          password: this.#password,
          state: auth.state
        }
      }
    );

    if(!response.headers.location) {
      throw new Error("Expected the Location header to be defined");
    }

    const queryStringFromHash = new URL.URL(response.headers.location).hash.slice(1);

    const { access_token, expires_in } = querystring.parse(queryStringFromHash) as { access_token: string; expires_in: string };

    this.#sessionExpiresAt = new this.#configuration.clock.Date(this.#configuration.clock.Date.now() + parseInt(expires_in) * 1000);
    this.#accessToken = access_token;

    this.#configuration.logger.info("Successfully authenticated with the Connected Drive API");
  }

  /** Returns a list specifying the physical configuration of vehicles associated with the login credentials. */
  async getVehicles(): Promise<GetVehiclesResponse> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicles;

    return await this.#httpRequest<GetVehiclesResponse>({ path });
  }

  /** Returns details about a specific vehicle's supported Connected Drive services. */
  async getVehicleDetails(vehicleVin: string): Promise<GetVehicleDetails> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicleDetails
      .replace("{vehicleVin}", vehicleVin);

    return await this.#httpRequest<GetVehicleDetails>({ path });
  }

  /** Returns details about a specific vehicle's supported Connected Drive services. */
  async getVehicleTechnicalDetails(vehicleVin: string): Promise<GetTechnicalVehicleDetails> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicleTechnicalDetails
      .replace("{vehicleVin}", vehicleVin);

    return await this.#httpRequest<GetTechnicalVehicleDetails>({ path });
  }

  /** Returns a list specifying the connectivity and Connected Drive service status of vehicles associated with the login credentials. */
  async getStatusOfAllVehicles(): Promise<GetStatusOfAllVehiclesResponse> {
    const path = this.#configuration.connectedDrive.endpoints.getStatusOfAllVehicles;

    return await this.#httpRequest<GetStatusOfAllVehiclesResponse>({ path });
  }

  /**
   * Execute a Connected Drive remote service. This may throw if:
   * - specified vin isn't registered on the user
   * - remote services aren't activated on the car
   * - the car isn't online
   * - the car-user relation hasn't been confirmed
   * - the remote service takes too long time to complete. Default timeout 1 min.
   * - if a new remote service command is sent to the car before this action has completed.
   */
  async executeRemoteService(vehicleVin: string, service: RemoteService): Promise<void> {
    const before = this.#configuration.clock.Date.now();

    const vehicleDetailsPath = this.#configuration.connectedDrive.endpoints.getStatusOfAllVehicles
      .replace("{vehicleVin}", vehicleVin);

    const { vehicleRelationship } = await this.#httpRequest<GetStatusOfAllVehiclesResponse>({ path: vehicleDetailsPath });
    const foundVehicle = vehicleRelationship.find(({ vin }) => vehicleVin === vin);

    if(!foundVehicle) {
      throw new Error(`Incorrect vehicle vin specified: '${vehicleVin}'. Found: ${JSON.stringify(vehicleRelationship.map(({ vin }) => vin))}`);
    }

    if(foundVehicle.remoteServiceStatus !== "ACTIVE") {
      throw new Error(`The 'Remote Service' capability does not seem to be activated for vehicle ${vehicleVin}. Service status: ${foundVehicle.remoteServiceStatus}`);
    }

    if(foundVehicle.connectivityStatus !== "ACTIVE") {
      throw new Error(`Vehicle ${vehicleVin} does not seem to be online. Connectivity status: ${foundVehicle.connectivityStatus}`);
    }

    if(foundVehicle.relationshipStatus !== "CONFIRMED") {
      throw new Error(`The user account does not seem to be a recognized owner of Vehicle ${vehicleVin}. Relationship status: ${foundVehicle.relationshipStatus}`);
    }

    const path = this.#configuration.connectedDrive.endpoints.executeRemoteServices
      .replace("{vehicleVin}", vehicleVin)
      .replace("{serviceType}", RemoteServiceCommand[service]);

    const { eventId: { eventId: triggeredEventId } } = await this.#httpRequest<StartRemoteServiceResponse>({
      path,
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: "{}"
    });

    await this.#waitUntil(async() => {
      const status = await this.#getRemoteServiceStatus(vehicleVin);

      const {
        event: {
          eventId,
          rsEventStatus,
          actions
        }
      } = status;

      if(triggeredEventId !== eventId) {
        throw new Error("Event ID changed. Another operation is sent to the vehicle.");
      }

      // The actions list is not sorted by time by default.
      // Sort the list to get the correct storyline in the log line below.
      actions.sort((A, B) => new Date(A.creationTime).valueOf() - new Date(B.creationTime).valueOf());

      this.#configuration.logger.debug(`Command ${service} executed actions: ${JSON.stringify(actions)}`);

      const currentAction = actions.pop();

      this.#configuration.logger.info(
        `Waiting for command ${service} to be executed on ${vehicleVin} ` +
        `(eventId: ${eventId}, duration: ${this.#configuration.clock.Date.now() - before} ms): ` +
        `${rsEventStatus} (${currentAction?.rsDetailedStatus || "null"})`
      );

      return status.event.rsEventStatus === RemoteServiceExecutionState.EXECUTED;
    }, {
      message: `Timed out awaiting Connected Drive to execute service ${service}`,
      timeoutMs: this.#configuration.connectedDrive.remoteServiceExecutionTimeoutMs,
      stepMs: this.#configuration.connectedDrive.pollIntervalMs
    });

    this.#configuration.logger.info(`${service} executed on ${vehicleVin} after ${this.#configuration.clock.Date.now() - before} ms`);
  }

  /** Poll the Connected Drive API for the current remote service execution status. */
  async #getRemoteServiceStatus(vehicleVin: string): Promise<GetRemoteServiceStatusResponse> {
    const path = this.#configuration.connectedDrive.endpoints.statusRemoteServices
      .replace("{vehicleVin}", vehicleVin);

    return await this.#httpRequest<GetRemoteServiceStatusResponse>({ path });
  }

  /** Helper function that fulfills its promise once the specified 'fn' return true. */
  async #waitUntil(
    fn: () => Promise<boolean>,
    { timeoutMs, message, stepMs = 1000 }: {timeoutMs: number, message: string, stepMs?: number}
  ): Promise<void> {
    const { clock } = this.#configuration;

    const start = clock.Date.now();

    while((clock.Date.now() - start) < timeoutMs) {
      if(await fn()) {
        return;
      }
      else {
        await new Promise<void>(resolve => this.#configuration.clock.setTimeout(resolve, stepMs).unref());
      }
    }

    throw new Error(message);
  }
}
