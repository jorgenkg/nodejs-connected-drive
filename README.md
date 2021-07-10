# BMW Connected Drive

A NodeJS client library written in TypeScript with test coverage. The implementation is intended for use in Smart Home applications.

## Requirements

`node >= 12.0`

## Installation

```bash
npm i -S nodejs-connected-drive
```

## Example usage

```javascript
import { ConnectedDrive, RemoteService } from "nodejs-connected-drive";

// Setup the API client
const api = new ConnectedDrive(username, password);

// Fetch a list of vehicles associated with the credentials
const [{vin: vehicleIdentificationNumber}] = await api.getVehicles();

// Trigger the Remote Service for remotely heating/cooling the car.
await api.executeRemoteService(vehicleIdentificationNumber, RemoteService.CLIMATE_NOW);
```


## API

#### [Documentation is available here](https://jorgenkg.github.io/nodejs-connected-drive/)

Notable functions are listed on the [ConnectedDrive class](https://jorgenkg.github.io/nodejs-connected-drive/docs/classes/lib_connecteddrive.connecteddrive.html):
- `ConnectedDrive.getVehicles`
- `ConnectedDrive.executeRemoteService`
- `ConnectedDrive.getStatusOfAllVehicles`
- `ConnectedDrive.getVehicleDetails`
- `ConnectedDrive.getVehicleTechnicalDetails`

## Disclaimer

This library is not an official integration from BMW Connected Drive. This library is neither endorsed nor supported by BMW Connected Drive. This implementation is based on reverse engineering REST calls used by the BMW Connected Drive web app, and may thus intermittently stop working if the underlying API is updated.

Any utilization, consumption and application of this library is done at the user's own discretion. This library, its maintainers and BMW Connected Drive cannot guarantee the integrity of this library or any applications of this library.