import { VehicleFeature } from "../enums/VehicleFeature";

export type GetVehicleDetails = Array<{
  name: "cdpFeatures";
  services: Array<
    { name: VehicleFeature; status: "ACTIVE" | string; portfolioId: string; } |
    { name: "CLIMATE_FUNCTION_HEATING" | "CLIMATE_FUNCTION_VENTILATION" | "CLIMATE_FUNCTION_AIRCONDITIONING" | "CLIMATE_CONTROL_ONETIME_TIMER" | "CLIMATE_CONTROL_START_TIMER" | "REMOTE_SERVICES" | "INVOICES" | "MANAGE_SMARTPHONES" | "MYINFO" | "MAP_INTERNET_PORTAL" | "PAYMENT" | "SECURITY_QUESTIONS" | "SPM_DELETE" | "SPM_ONLINE_CHANGE" | "STORE" | "OTP"; }
  >;
}>;
