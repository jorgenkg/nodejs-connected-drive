import * as FakeTimer from "@sinonjs/fake-timers";
import {
  compose,
  defaults,
  test,
  withApi,
  withMockedConnectedDriveApi
} from "../test-helpers/index.js";
import { Middleware } from "../test-helpers/compose-types.js";

const clock = FakeTimer.createClock(0, Infinity);

test("It should support authentication with the user credentials", compose(
  withMockedConnectedDriveApi(defaults),
  withApi(defaults),
  async(api, t) => {
    await api.login();
    t.pass("Expected login not to throw");
  }
));

test("It should support automatic re-authentication once the credentials have expired", compose(
  (async next => {
    clock.reset();
    clock.setSystemTime(Date.now());
    await next();
  }) as Middleware<undefined>,
  withMockedConnectedDriveApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }),
  withApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }),
  async(api, t) => {
    await api.login();
    await clock.tickAsync("24:00:00");
    t.ok(await api.getVehicleDetails(defaults.mockData.vin), "Expected to automatically reauthenticate and fetch data");
  }
));

test("It should support automatic re-authentication if the access token have been revoked", compose(
  (async next => {
    clock.reset();
    clock.setSystemTime(Date.now());
    await next();
  }) as Middleware<undefined>,
  withMockedConnectedDriveApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }, { expose: true }),
  withApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }),
  async(driveApi, api, t) => {
    await api.login();
    driveApi.createNewToken();
    t.ok(await api.getVehicleDetails(defaults.mockData.vin), "Expected to automatically reauthenticate and fetch data");
  }
));

test("It should be able to fetch a list of vehicles registered to the credentials", compose(
  withMockedConnectedDriveApi(defaults),
  withApi(defaults),
  async(api, t) => {
    t.ok(await api.getVehicles(), "Expected getVehicles() to return data");
  }
));

test("It should be able to fetch status of vehicles registered to the credentials", compose(
  withMockedConnectedDriveApi(defaults),
  withApi(defaults),
  async(api, t) => {
    t.ok(await api.getStatusOfAllVehicles(), "Expected getStatusOfAllVehicles() to return data");
  }
));

test("It should be able to fetch details about a vehicle using its VIN", compose(
  withMockedConnectedDriveApi(defaults),
  withApi(defaults),
  async(api, t) => {
    t.ok(await api.getVehicleDetails(defaults.mockData.vin), "Expected getVehicleDetails() to return data");
  }
));

test("It should be able to execute 'Remote Services' on a vehicle if the capability has been enabled", compose(
  (async next => {
    clock.reset();
    clock.setSystemTime(Date.now());
    await next();
  }) as Middleware<undefined>,
  withMockedConnectedDriveApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }, { expose: true }),
  withApi({ ...defaults, clock: clock as unknown as typeof defaults.clock }),
  async(driveApi, api, t) => {
    const promiseServiceExecuted = api.executeRemoteService(defaults.mockData.vin, defaults.mockData.currentCommand);

    for(let i = 0; i < driveApi.remoteServiceStates.length - 1; i++) {
      driveApi.tickProvisionState();
      await clock.tickAsync(defaults.connectedDrive.pollIntervalMs);
      await new Promise<void>(resolve => setTimeout(resolve, 10));
    }

    await promiseServiceExecuted;
    t.pass("Expected test not to throw");
  }
));

test("It should be able to fetch technical details about a vehicle using its VIN", compose(
  withMockedConnectedDriveApi(defaults),
  withApi(defaults),
  async(api, t) => {
    t.ok(await api.getVehicleTechnicalDetails(defaults.mockData.vin), "Expected getVehicleTechnicalDetails() to return data");
  }
));
