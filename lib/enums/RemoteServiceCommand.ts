import { RemoteService } from "./RemoteService";
import { VehicleFeature } from "./VehicleFeature";

export const RemoteServiceCommand: {[key in RemoteService]: VehicleFeature} = {
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
