export type GetTechnicalVehicleDetails = {
  attributesMap: {
    remaining_fuel: string;
    condition_based_services: string;
    unitOfCombustionConsumption: string;
    unitOfLength: string;
    vehicle_tracking: string;
    unitOfEnergy: string;
    unitOfElectricConsumption: string;
    mileage: string;
  };
  vehicleMessages: {
    ccmMessages: any[];
    /** Service messages */
    cbsMessages: Array<{
      /** eg: "2021-05" */
      date: string;
      description: string;
      id: number;
      messageType: string;
      status: "PENDING" | "OK" | string;
      /** This describes the type of service required */
      text: string;
      unitOfLengthRemaining?: string;
    }>;
  };
};
