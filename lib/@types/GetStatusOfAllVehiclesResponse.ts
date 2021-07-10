
export type GetStatusOfAllVehiclesResponse = {
  "vehicleRelationship": Array<{
    "vin": string;
    "registrationNumber": null;
    "relationshipStatus": "CONFIRMED" | string;
    "remoteServiceStatus": "ACTIVE" | string;
    "connectivityStatus": "ACTIVE" | string;
    "confirmationType": "FULL" | string;
    "tokenId": null;
    "subscriberStatus": string;
    "hasSecondaryRelation": boolean;
  }>;
};
