# BMW Connected Drive

A NodeJS client library written in TypeScript with Tape tests covering basic functionality. This client implementation is intended for use in Smart Home applications.

## Requirements

`node >= 12.0`

## Installation

```bash
npm i -S nodejs-connected-drive
```

## Usage

```javascript
import { ConnectedDriveApi, RemoteService } from "nodejs-connected-drive";

// Setup the API client
const api = new ConnectedDriveApi(username, password);
// Fetch a list of vehicles associated with the credentials
const vehicleIdentificationNumber = await api.getVehicles()[0].vin;
// Trigger the Remote Service for remotely heating/cooling the car
await api.executeRemoteService(vehicleIdentificationNumber, RemoteService.CLIMATE_NOW);
```


## API

### Constructor | new ConnectedDriveApi( username, password )

##### username

Type: `string`

The user name of an existing BMW Connected Drive account.

##### password

Type: `string`

The password associated with the BMW Connected Drive account

### Methods

#### executeRemoteService | `executeRemoteService(vehicleVin: string, service: RemoteService): Promise<void>`
Execute the specific service via the Connected Drive API. The function will resolve once the service command has been relayed to the vehicle.

##### vehicleVin
Type: `string`

The vehicle's unique identifier. This ID can be fetched using eg. `getVehicles()`

##### service
Type: `"LIGHT_FLASH" | "DOOR_LOCK" | "DOOR_UNLOCK" | "HORN_BLOW" | "CLIMATE_NOW"`


#### getVehicles | `getVehicles(): Promise<GetVehiclesResponse>`
Fetch a list of vehicles associated with the login credentials

...

## Disclaimer
This library is NOT an official integration from BMW Connected Drive. This library is neither endorsed nor supported by BMW Connected Drive. This implementation is based on reverse engineering REST calls used by the BMW Connected Drive web app, and may thus intermittently stop working if the underlying API is updated.

Any utilization, consumption and application of this library is done at the user's own discretion. This library, its maintainers and BMW Connected Drive cannot guarantee the integrity of this library or any applications of this library.