/** Enum of remote services that can be requested via the API. Eg: CLIMATE_NOW */
// eslint-disable-next-line no-shadow
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
  CLIMATE_NOW = "CLIMATE_NOW"
}
