import { RemoteServiceExecutionState } from "../enums/RemoteServiceExecutionState";
import { RemoteServiceExecutionStateDetailed } from "../enums/RemoteServiceExecutionStateDetailed";
import { VehicleFeature } from "../enums/VehicleFeature";


export type GetRemoteServiceStatusResponse = {
  event: {
    eventId: string;
    rsType: VehicleFeature;
    rsTypeVersion: "v1";
    vin: string;
    userid: string;
    creationTime: string;
    lastUpdated: string;
    rsEventStatus: RemoteServiceExecutionState;
    requestParams: string;
    /** List of concluded events. The list is *not* sorted by time. */
    actions: Array<{
      rsStatus: RemoteServiceExecutionState;
      rsDetailedStatus: RemoteServiceExecutionStateDetailed;
      initiationError: "NO_ERROR" | string;
      rsError: "NO_ERROR" | string;
      creationTime: string;
      initStatus: true;
    }>;
    uploads: [];
  };
};
