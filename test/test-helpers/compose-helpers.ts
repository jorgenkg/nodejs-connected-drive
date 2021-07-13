/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as bodyParser from "koa-bodyparser";
import * as crypto from "crypto";
import * as http from "http";
import * as Koa from "koa";
import * as Router from "@koa/router";
import * as tape from "tape";
import * as util from "util";
import { ConnectedDrive } from "../../lib/ConnectedDrive.js";
import { Middleware, TestComposer } from "./compose-types.js";
import { RemoteServiceCommand } from "../../lib/enums/RemoteServiceCommand.js";
import { RemoteServiceExecutionState } from "../../lib/enums/RemoteServiceExecutionState.js";
import { RemoteServiceExecutionStateDetailed } from "../../lib/enums/RemoteServiceExecutionStateDetailed.js";
import type { Configuration } from "../../lib/@types/Configuration";
import type { GetRemoteServiceStatusResponse } from "../../lib/@types/GetRemoteServiceStatusResponse";
import type { GetStatusOfAllVehiclesResponse } from "../../lib/@types/GetStatusOfAllVehiclesResponse";
import type { GetTechnicalVehicleDetails } from "../../lib/@types/GetTechnicalVehicleDetails";
import type { GetVehicleDetails } from "../../lib/@types/GetVehicleDetails";
import type { GetVehiclesResponse } from "../../lib/@types/GetVehiclesResponse";
import type { StartRemoteServiceResponse } from "../../lib/@types/StartRemoteServiceResponse";


export const compose: TestComposer = (...composers: unknown[]) => {
  const test = composers.pop() as (...args: unknown[]) => Promise<void>;
  const results: unknown[] = [];

  return async function _compose(t: tape.Test): Promise<void> {
    if (composers.length === 0) {
      await test(...results, t);
    }
    else {
      const middleware = composers.shift() as Middleware<unknown>; // leftmost middleware
      await middleware(
        async(result: unknown) => {
          if(result !== undefined) {
            results.push(result);
          }
          await _compose(t);
        }
      );
    }
  };
};

export function withApi(configuration: Configuration<true>, {
  username,
  password,
}: {
  username?: string;
  password?: string;
} = {}): Middleware<ConnectedDrive<true>> {
  return async next => {
    await next(new ConnectedDrive<true>(
      username || configuration.mockData.username,
      password || configuration.mockData.password,
      configuration
    ));
  };
}

class MockedConnectedDriveApi extends Koa {
  private token?: string;
  private tokenExpiresAt?: Date;

  private configuration: Configuration<true>;

  private remoteServiceStateCount = 1;
  public remoteServiceStates: Array<{
    rsStatus: string;
    rsDetailedStatus: RemoteServiceExecutionStateDetailed;
    initiationError: string;
    rsError: string;
    initStatus: boolean;
  }> = [
    {
      rsStatus: "STARTED",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.UNKNOWN,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "PROV_PENDING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.OTHER_SERVICE_WITH_PROVISIONING_RUNNING,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "PROV_RUNNING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.PROVISIONING_STARTED,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "PENDING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.SMS_DELIVERED_TO_GATEWAY,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "PROV_RUNNING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.PROVISIONING_FINISHED,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "RUNNING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.SMS_DELIVERED_TO_VEHICLE,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "RUNNING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.DLQ_MESSAGE_PROVIDED,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    },
    {
      rsStatus: "RUNNING",
      rsDetailedStatus: RemoteServiceExecutionStateDetailed.DLQ_MESSAGE_FETCHED,
      initiationError: "NO_ERROR",
      rsError: "NO_ERROR",
      initStatus: true
    }
  ];


  constructor(config: Configuration<true>) {
    super();
    this.configuration = config;

    this.token = this.createNewToken();

    const router = new Router();

    router.post(this.configuration.connectedDrive.auth.endpoints.authenticate, bodyParser({ enableTypes: ["form"] }), ctx => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        username,
        password,
        state
      } = ctx.request.body as Record<string, string>;

      if(client_id !== this.configuration.connectedDrive.auth.client_id) {
        ctx.response.status = 400;
        ctx.response.message = "Wrong client_id";
        return;
      }
      if(redirect_uri !== this.configuration.connectedDrive.auth.redirect_uri) {
        ctx.response.status = 400;
        ctx.response.message = "Wrong redirect_uri";
        return;
      }
      if(response_type !== this.configuration.connectedDrive.auth.response_type) {
        ctx.response.status = 400;
        ctx.response.message = "Wrong response_type";
        return;
      }
      if(scope !== this.configuration.connectedDrive.auth.scope) {
        ctx.response.status = 400;
        ctx.response.message = "Wrong scope";
        return;
      }
      if(username !== this.configuration.mockData.username) {
        ctx.response.status = 401;
        ctx.response.message = "Wrong username";
        return;
      }
      if(password !== this.configuration.mockData.password) {
        ctx.response.status = 401;
        ctx.response.message = "Wrong password";
        return;
      }

      if(!this.token) {
        throw new Error("Token not defined");
      }

      ctx.set("Location", `${this.configuration.connectedDrive.auth.redirect_uri}#access_token=${this.token}&expires_in=${60 * 60}&state=${state}`);
      ctx.redirect(`${this.configuration.connectedDrive.auth.redirect_uri}#access_token=${this.token}&expires_in=${60 * 60}&state=${state}`);
    });

    router.use(async(ctx, next) => {
      const { authorization } = ctx.request.headers;
      if(!authorization || !this.isValidToken(authorization)) {
        ctx.response.status = 401;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ctx.response.body = { message: `Invalid token provided: '${authorization}'` };
        return;
      }
      await next();
    });

    router.use(bodyParser({ enableTypes: ["json"] }));

    router.get(this.configuration.connectedDrive.endpoints.getVehicles.split("?")[0], ctx => {
      ctx.response.status = 200;
      ctx.response.body = [
        {
          series: "X",
          basicType: "X3 XDRIVE20D",
          bodyType: "Sports Activity Vehicle",
          brand: "BMW",
          modelName: "X3 xDrive20d",
          vin: this.configuration.mockData.vin,
          licensePlate: null,
          modelYearNA: null,
          dcOnly: false,
          hasNavi: true,
          hasSunRoof: true,
          doorCount: 5,
          maxFuel: null,
          hasRex: false,
          steering: "LEFT",
          driveTrain: "CONV",
          supportedChargingModes: []
        }
      ] as GetVehiclesResponse;
    });

    router.get(this.configuration.connectedDrive.endpoints.getStatusOfAllVehicles.split("?")[0], ctx => {
      ctx.response.status = 200;
      ctx.response.body = {
        vehicleRelationship: [
          {
            vin: this.configuration.mockData.vin,
            registrationNumber: null,
            relationshipStatus: "CONFIRMED",
            remoteServiceStatus: "ACTIVE",
            connectivityStatus: "ACTIVE",
            confirmationType: "FULL",
            tokenId: null,
            subscriberStatus: "PRIMARY",
            hasSecondaryRelation: false
          }
        ]
      } as GetStatusOfAllVehiclesResponse;
    });

    router.get(this.configuration.connectedDrive.endpoints.getVehicleDetails.replace("{vehicleVin}", ":vehicleVin"), ctx => {
      if(ctx.params.vehicleVin !== this.configuration.mockData.vin) {
        ctx.response.status = 400;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ctx.response.body = { message: `Incorrect vin specified: '${ctx.params.vehicleVin}'. Should be: '${this.configuration.mockData.vin}'` };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = [{
        "name": "cdpFeatures",
        "services": [{
          "name": "CLIMATE_FUNCTION_HEATING",
          "status": null,
          "portfolioId": null
        }, {
          "name": "CLIMATE_FUNCTION_VENTILATION",
          "status": null,
          "portfolioId": null
        }, {
          "name": "CLIMATE_FUNCTION_AIRCONDITIONING",
          "status": null,
          "portfolioId": null
        }, {
          "name": "CLIMATE_CONTROL_ONETIME_TIMER",
          "status": null,
          "portfolioId": null
        }, {
          "name": "CLIMATE_CONTROL_START_TIMER",
          "status": null,
          "portfolioId": null
        }, {
          "name": "INVOICES",
          "status": null,
          "portfolioId": null
        }, {
          "name": "MANAGE_SMARTPHONES",
          "status": null,
          "portfolioId": null
        }, {
          "name": "MYINFO",
          "status": null,
          "portfolioId": null
        }, {
          "name": "MAP_INTERNET_PORTAL",
          "status": null,
          "portfolioId": null
        }, {
          "name": "PAYMENT",
          "status": null,
          "portfolioId": null
        }, {
          "name": "SECURITY_QUESTIONS",
          "status": null,
          "portfolioId": null
        }, {
          "name": "REMOTE_SERVICES",
          "status": null,
          "portfolioId": null
        }, {
          "name": "RCN",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "RDL",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "RDU",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "RHB",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "RLF",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "RCT",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "SPM_DELETE",
          "status": null,
          "portfolioId": null
        }, {
          "name": "SPM_ONLINE_CHANGE",
          "status": null,
          "portfolioId": null
        }, {
          "name": "STORE",
          "status": null,
          "portfolioId": null
        }, {
          "name": "VF",
          "status": "ACTIVE",
          "portfolioId": "RemoteOffer000"
        }, {
          "name": "OTP",
          "status": null,
          "portfolioId": null
        }]
      }] as GetVehicleDetails;
    });

    router.get(this.configuration.connectedDrive.endpoints.statusRemoteServices.replace("{vehicleVin}", ":vehicleVin"), ctx => {
      if(!ctx.params.vehicleVin) {
        ctx.response.status = 400;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ctx.response.body = { message: `Incorrect vin specified: '${ctx.params.vehicleVin}'. Should be: '${this.configuration.mockData.vin}'` };
        return;
      }

      const rsEventStatus: string = (() => {
        const state: RemoteServiceExecutionStateDetailed = this.remoteServiceStates[this.remoteServiceStateCount - 1].rsDetailedStatus;

        switch(state) {
        case RemoteServiceExecutionStateDetailed.UNKNOWN: return RemoteServiceExecutionState.PENDING;
        case RemoteServiceExecutionStateDetailed.OTHER_SERVICE_WITH_PROVISIONING_RUNNING: return RemoteServiceExecutionState.PENDING;
        case RemoteServiceExecutionStateDetailed.PROVISIONING_STARTED: return RemoteServiceExecutionState.PENDING;
        case RemoteServiceExecutionStateDetailed.SMS_DELIVERED_TO_GATEWAY: return RemoteServiceExecutionState.RUNNING;
        case RemoteServiceExecutionStateDetailed.PROVISIONING_FINISHED: return RemoteServiceExecutionState.RUNNING;
        case RemoteServiceExecutionStateDetailed.SMS_DELIVERED_TO_VEHICLE: return RemoteServiceExecutionState.RUNNING;
        case RemoteServiceExecutionStateDetailed.DLQ_MESSAGE_PROVIDED: return RemoteServiceExecutionState.RUNNING;
        case RemoteServiceExecutionStateDetailed.DLQ_MESSAGE_FETCHED: return RemoteServiceExecutionState.EXECUTED;
        default:
          this.configuration.logger.error(`unhandled state: ${state}`);
          return RemoteServiceExecutionState.PENDING;
        }
      })();

      ctx.response.status = 200;
      ctx.response.body = {
        "event": {
          "eventId": this.configuration.mockData.eventId,
          "rsType": RemoteServiceCommand[this.configuration.mockData.currentCommand],
          "rsTypeVersion": "v1",
          "vin": this.configuration.mockData.vin,
          "userid": crypto.randomBytes(4).toString("hex"),
          "creationTime": new this.configuration.clock.Date().toISOString(),
          "lastUpdated": new this.configuration.clock.Date().toISOString(),
          "rsEventStatus": rsEventStatus,
          "requestParams": "{\"clientId\":3,\"doorControl\":\"LOCK\"}",
          "actions": this.remoteServiceStates.slice(0, this.remoteServiceStateCount).map((state, index) => ({
            ...state,
            creationTime: new this.configuration.clock.Date(this.configuration.clock.Date.now() - (this.remoteServiceStateCount - index)).toISOString(),
          })),
          "uploads": []
        }
      } as GetRemoteServiceStatusResponse;
    });

    router.post(this.configuration.connectedDrive.endpoints.executeRemoteServices.replace("{vehicleVin}", ":vehicleVin").replace("{serviceType}", RemoteServiceCommand[this.configuration.mockData.currentCommand]), ctx => {
      if(!ctx.params.vehicleVin) {
        ctx.response.status = 400;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ctx.response.body = { message: `Incorrect vin specified: '${ctx.params.vehicleVin}'. Should be: '${this.configuration.mockData.vin}'` };
        return;
      }

      if(ctx.request.headers["content-type"] !== "application/json;charset=UTF-8") {
        ctx.response.status = 400;
        ctx.response.body = { message: "content-type must be 'application/json;charset=UTF-8'" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        eventId: { eventId: this.configuration.mockData.eventId },
        vin: this.configuration.mockData.vin,
        creationTime: new this.configuration.clock.Date().toISOString()
      } as StartRemoteServiceResponse;
    });

    router.get(this.configuration.connectedDrive.endpoints.getVehicleTechnicalDetails.replace("{vehicleVin}", ":vehicleVin"), ctx => {
      if(ctx.params.vehicleVin !== this.configuration.mockData.vin) {
        ctx.response.status = 400;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        ctx.response.body = { message: `Incorrect vin specified: '${ctx.params.vehicleVin}'. Should be: '${this.configuration.mockData.vin}'` };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        "attributesMap": {
          "remaining_fuel": "48",
          "condition_based_services": "3,PENDING,2021-05,;1,OK,2023-02,25000;100,OK,2025-02,60000;",
          "unitOfCombustionConsumption": "l/100km",
          "unitOfLength": "km",
          "vehicle_tracking": "false",
          "unitOfEnergy": "kWh",
          "unitOfElectricConsumption": "kWh/100km",
          "mileage": "116709"
        },
        "vehicleMessages": {
          "ccmMessages": [],
          "cbsMessages": [{
            "date": "2021-05",
            "description": "Reserve service.",
            "id": 3,
            "messageType": "CBS",
            "status": "PENDING",
            "text": "Brake fluid"
          }, {
            "date": "2023-02",
            "description": "Reserve service.",
            "id": 1,
            "messageType": "CBS",
            "status": "OK",
            "text": "Engine oil",
            "unitOfLengthRemaining": "25000"
          }, {
            "date": "2025-02",
            "description": "Reserve service.",
            "id": 100,
            "messageType": "CBS",
            "status": "OK",
            "text": "Visual inspection",
            "unitOfLengthRemaining": "60000"
          }]
        }
      } as GetTechnicalVehicleDetails;
    });

    this.use(router.routes());
  }

  public isValidToken(bearerToken: string) {
    return this.token === bearerToken.replace(/Bearer /i, "");
  }

  public createNewToken() {
    this.token = crypto.randomBytes(4).toString("hex");
    this.tokenExpiresAt = new Date(this.configuration.clock.Date.now() + 1000 * 60 * 60);
    return this.token;
  }

  public tickProvisionState() {
    this.remoteServiceStateCount += 1;
  }

  public tickProvisionStateToCompletion() {
    this.remoteServiceStateCount = this.remoteServiceStates.length;
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withMockedConnectedDriveApi<T extends boolean = false>(
  configuration: Configuration<true>,
  { expose = false as T }: {expose?: T} = { expose: false as T }
) {

  if(expose) {
    return (async next => {
      const application = new MockedConnectedDriveApi(configuration);

      const server = new http.Server(application.callback());

      await new Promise<void>(resolve => server.listen(configuration.connectedDrive.port, resolve));

      try {
        await next(application);
      }
      catch(error) {
        configuration.logger.error(util.inspect(error, false, null));
      }
      finally {
        await new Promise(resolve => server.close(resolve));
      }
    }) as T extends true ? Middleware<MockedConnectedDriveApi> : never;
  }
  else {
    return (async next => {
      const application = new MockedConnectedDriveApi(configuration);

      const server = new http.Server(application.callback());

      await new Promise<void>(resolve => server.listen(configuration.connectedDrive.port, resolve));

      try {
        await next();
      }
      catch(error) {
        configuration.logger.error(util.inspect(error, false, null));
      }
      finally {
        await new Promise(resolve => server.close(resolve));
      }
    }) as T extends true ? never : Middleware;
  }
}
