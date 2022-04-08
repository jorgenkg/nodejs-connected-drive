import { deepMerge } from "./misc/deepMerge";
import { RemoteService } from "./enums/RemoteService";
import { RemoteServiceCommand } from "./enums/RemoteServiceCommand";
import { RemoteServiceExecutionState } from "./enums/RemoteServiceExecutionState";
import { URL } from "iso-url";
import DefaultConfiguration from "./config/default.js";
import fetch from "cross-fetch";
import fetchRetry from "./misc/fetchRetry";
import type { Configuration } from "./@types/Configuration";
import type { DeepPartial } from "./@types/DeepPartial";
import type { GetRemoteServiceStatusResponse } from "./@types/GetRemoteServiceStatusResponse";
import type { GetStatusOfAllVehiclesResponse as GetStatusOfAllVehiclesResponse } from "./@types/GetStatusOfAllVehiclesResponse";
import type { GetTechnicalVehicleDetails } from "./@types/GetTechnicalVehicleDetails";
import type { GetVehicleDetails } from "./@types/GetVehicleDetails";
import type { GetVehiclesResponse } from "./@types/GetVehiclesResponse";
import type { StartRemoteServiceResponse } from "./@types/StartRemoteServiceResponse";

/**
 * SDK class that expose the Connected Drive API.
 *
 * Note that `login()` does not need to be called explicitly.
 * The SDK will lazily call `login()` to (re)authenticate when necessary.
 */
export class ConnectedDrive<Test extends boolean = false> {
  readonly #configuration: Configuration<Test>;
  readonly #username: string;
  readonly #password: string;
  #sessionExpiresAt?: Date;
  #accessToken?: string;

  /** The generic type parameter should be either omitted or `false` in production. */
  constructor(
    /** Required. The Connected Drive username */
    username: string,
    /** Required. The Connected Drive username */
    password: string,
    /** Optional. Override the default configuration. */
    configuration?: DeepPartial<Configuration<Test>>
  ) {
    this.#configuration = (!configuration ? DefaultConfiguration : deepMerge(DefaultConfiguration, configuration)) as Configuration<Test>;
    this.#username = username;
    this.#password = password;
  }

  /** Send a REST request to the Connected Drive API */
  async #httpRequest<T>({
    path, method = "GET", body, forceLogin = false, headers
  }: {
    path: string;
    method?: "POST" | "GET";
    body?: string;
    headers?: Record<string, string>;
    forceLogin?: boolean;
  }): Promise<T> {
    if (forceLogin || !this.#sessionExpiresAt || (this.#sessionExpiresAt.valueOf() - this.#configuration.clock.Date.now()) < 1000 * 60) {
      await this.login();
    }

    if (!this.#accessToken) {
      throw new Error("No access token available");
    }

    const { connectedDrive: { host } } = this.#configuration;

    this.#configuration.logger.debug(`${method} ${host}${path} ${forceLogin ? "(retry)" : ""}`);
    const response = await fetchRetry(
      new URL(path, host).href,
      {
        method,
        headers: {
          ...headers,
          authorization: `Bearer ${this.#accessToken}`,
          ["user-agent"]: "nodejs-connected-drive",
        },
        body,
      },
      {
        limit: 2,
        statusCodes: [404, 503, 504],
      }
    );
    if (response.status === 401 && !forceLogin) {
      return await this.#httpRequest({
        path, method, body, forceLogin: true
      });
    }
    else if (response.status >= 400) {
      throw new Error(`HTTP ${method} ${path}: Status: ${response.status}. Response body: ${await response.text()}`);
    }
    const responseBody = await response.json() as T;
    this.#configuration.logger.debug(`${method} ${host}${path} response status ${response.status}`, { body: responseBody });
    return responseBody;
  }

  /** Authenticate with the Connected Drive API and store the resulting access_token on 'this'. This function is also called lazily by the SDK when necessary. */
  async login(): Promise<void> {
    const { connectedDrive: { auth } } = this.#configuration;

    const formData = new URLSearchParams();
    formData.set("client_id", auth.client_id);
    formData.set("redirect_uri", auth.redirect_uri);
    formData.set("response_type", auth.response_type);
    formData.set("scope", auth.scope);
    formData.set("username", this.#username);
    formData.set("password", this.#password);
    formData.set("state", auth.state);

    const response = await fetch(
      new URL(auth.endpoints.authenticate, auth.host).toString(),
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      }
    );

    const location = response.headers.get("location");

    if (!location) {
      throw new Error("Expected the Location header to be defined");
    }

    const queryStringFromHash = new URL(location).hash.slice(1);

    const params = new URLSearchParams(queryStringFromHash);
    const access_token = params.get("access_token") as string;
    const expires_in = params.get("expires_in") as string;

    this.#sessionExpiresAt = new this.#configuration.clock.Date(this.#configuration.clock.Date.now() + parseInt(expires_in) * 1000);
    this.#accessToken = access_token;

    this.#configuration.logger.info("Successfully authenticated with the Connected Drive API");
  }

  /** Returns a list specifying the physical configuration of vehicles. */
  async getVehicles(): Promise<GetVehiclesResponse> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicles;

    return await this.#httpRequest<GetVehiclesResponse>({ path });
  }

  /** Returns details describing the Connected Drive services supported by the vehicle. */
  async getVehicleDetails(vehicleVin: string): Promise<GetVehicleDetails> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicleDetails
      .replace("{vehicleVin}", vehicleVin);

    return await this.#httpRequest<GetVehicleDetails>({ path });
  }

  /** Returns technical details of the vehicle such as milage, fuel reserve and service messages. */
  async getVehicleTechnicalDetails(vehicleVin: string): Promise<GetTechnicalVehicleDetails> {
    const path = this.#configuration.connectedDrive.endpoints.getVehicleTechnicalDetails
      .replace("{vehicleVin}", vehicleVin);

    return await this.#httpRequest<GetTechnicalVehicleDetails>({ path });
  }

  /** Returns a list of vehicles detailing their connectivity and Connected Drive service status. */
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

    if (!foundVehicle) {
      throw new Error(`Incorrect vehicle vin specified: '${vehicleVin}'. Found: ${JSON.stringify(vehicleRelationship.map(({ vin }) => vin))}`);
    }

    if (foundVehicle.remoteServiceStatus !== "ACTIVE") {
      throw new Error(`The 'Remote Service' capability does not seem to be activated for vehicle ${vehicleVin}. Service status: ${foundVehicle.remoteServiceStatus}`);
    }

    if (foundVehicle.connectivityStatus !== "ACTIVE") {
      throw new Error(`Vehicle ${vehicleVin} does not seem to be online. Connectivity status: ${foundVehicle.connectivityStatus}`);
    }

    if (foundVehicle.relationshipStatus !== "CONFIRMED") {
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

      const { event: { eventId, rsEventStatus, actions } } = status;

      if (triggeredEventId !== eventId) {
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
    { timeoutMs, message, stepMs = 1000 }: { timeoutMs: number; message: string; stepMs?: number; }
  ): Promise<void> {
    const { clock } = this.#configuration;

    const start = clock.Date.now();

    while ((clock.Date.now() - start) < timeoutMs) {
      if (await fn()) {
        return;
      }
      else {
        await new Promise<void>(resolve => this.#configuration.clock.setTimeout(resolve, stepMs).unref());
      }
    }

    throw new Error(message);
  }
}
