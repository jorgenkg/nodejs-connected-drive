/* eslint-disable no-shadow */
export enum RemoteServiceExecutionState {
  STARTED = "STARTED",
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  PROV_RUNNING = "PROV_RUNNING",
  EXECUTED = "EXECUTED",
  UNKNOWN = "UNKNOWN",
}

export enum RemoteServiceExecutionStateDetailed {
  UNKNOWN = "UNKNOWN",
  OTHER_SERVICE_WITH_PROVISIONING_RUNNING = "OTHER_SERVICE_WITH_PROVISIONING_RUNNING",
  PROVISIONING_STARTED = "PROVISIONING_STARTED",
  SMS_DELIVERED_TO_GATEWAY = "SMS_DELIVERED_TO_GATEWAY",
  PROVISIONING_FINISHED = "PROVISIONING_FINISHED",
  SMS_DELIVERED_TO_VEHICLE = "SMS_DELIVERED_TO_VEHICLE",
  DLQ_MESSAGE_PROVIDED = "DLQ_MESSAGE_PROVIDED",
  DLQ_MESSAGE_FETCHED = "DLQ_MESSAGE_FETCHED",
  UPLINK_MESSAGE_ACK = "UPLINK_MESSAGE_ACK",
  DEPROVISIONING_STARTED = "DEPROVISIONING_STARTED",
  DEPROVISIONING_FINISHED = "DEPROVISIONING_FINISHED",
}

/** Enum of remote services that can be requested via the API. Eg: CLIMATE_NOW */
export enum RemoteService {
  /** Flash headlights */
  LIGHT_FLASH = "LIGHT_FLASH",
  /** Lock the doors */
  DOOR_LOCK = "DOOR_LOCK",
  /** Unlock the doors */
  DOOR_UNLOCK = "DOOR_UNLOCK",
  /** Signal with the horn */
  HORN_BLOW = "HORN_BLOW",
  /** Start heating or cooling the car depending on the temperature outside */
  CLIMATE_NOW = "CLIMATE_NOW",
}

export enum VehicleFeature {
  /** climate */
  RCN = "RCN",
  /** lock */
  RDL = "RDL",
  /** unlock */
  RDU = "RDU",
  /** horn */
  RHB = "RHB",
  /** light */
  RLF = "RLF",
  /** Climate timer */
  RCT = "RCT",
}

export const RemoteServiceCommand: Record<RemoteService, VehicleFeature> = {
  /** climate */
  CLIMATE_NOW: VehicleFeature.RCN,
  /** lock */
  DOOR_LOCK: VehicleFeature.RDL,
  /** unlock */
  DOOR_UNLOCK: VehicleFeature.RDU,
  /** horn */
  HORN_BLOW: VehicleFeature.RHB,
  /** light */
  LIGHT_FLASH: VehicleFeature.RLF,
};


export type GetVehiclesResponse = Array<{
  "series":string,
  "basicType":string,
  "bodyType":string,
  "brand":string,
  "modelName":string,
  "vin":string,
  "licensePlate":null,
  "modelYearNA":null,
  "dcOnly":boolean,
  "hasNavi":boolean,
  "hasSunRoof":boolean,
  "doorCount":number,
  "maxFuel":null,
  "hasRex":boolean,
  "steering":string,
  "driveTrain":string,
  "supportedChargingModes":[]
}>;

export type GetStatusOfAllVehiclesResponse = {
  "vehicleRelationship": Array<{
    "vin":string,
    "registrationNumber":null,
    "relationshipStatus":"CONFIRMED" | string,
    "remoteServiceStatus":"ACTIVE" | string,
    "connectivityStatus":"ACTIVE" | string,
    "confirmationType":"FULL" | string,
    "tokenId":null,
    "subscriberStatus":string,
    "hasSecondaryRelation":boolean
  }>
};

export type GetVehicleDetails = Array<{
  "name":"cdpFeatures",
  "services": Array<
    {name: VehicleFeature; status: "ACTIVE"|string; portfolioId: string;}
    | { name: "CLIMATE_FUNCTION_HEATING"|"CLIMATE_FUNCTION_VENTILATION"|"CLIMATE_FUNCTION_AIRCONDITIONING"|"CLIMATE_CONTROL_ONETIME_TIMER"|"CLIMATE_CONTROL_START_TIMER"|"REMOTE_SERVICES"|"INVOICES"|"MANAGE_SMARTPHONES"|"MYINFO"|"MAP_INTERNET_PORTAL"|"PAYMENT"|"SECURITY_QUESTIONS"|"SPM_DELETE"|"SPM_ONLINE_CHANGE"|"STORE"|"OTP"}
  >
}>

export type GetRemoteServiceStatusResponse = {
  "event": {
    "eventId": string,
    "rsType": VehicleFeature,
    "rsTypeVersion": "v1",
    "vin": string,
    "userid": string,
    "creationTime": string,
    "lastUpdated": string,
    "rsEventStatus": RemoteServiceExecutionState,
    "requestParams": string,
    /** List of concluded events. The list is *not* sorted by time. */
    "actions": Array<{
      "rsStatus": RemoteServiceExecutionState,
      "rsDetailedStatus": RemoteServiceExecutionStateDetailed,
      "initiationError": "NO_ERROR" | string,
      "rsError": "NO_ERROR" | string,
      "creationTime": string,
      "initStatus": true
    }>,
    "uploads": []
  }
}

export type StartRemoteServiceResponse = {
  eventId: {
    eventId: string
  },
  vin: string,
  creationTime: string
}
