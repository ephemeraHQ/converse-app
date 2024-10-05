import { Controlled } from "./Environment";
import { NetworkMonitorClient } from "../NetworkMonitor/NetworkMonitor";

jest.setTimeout(1);

describe.only("Environment", () => {
  let OriginalCurrent: typeof Controlled;
  beforeEach(() => {
    OriginalCurrent = { ...Controlled };
  });

  afterEach(() => {
    Object.entries(OriginalCurrent).forEach(([key, value]) => {
      Controlled[key as keyof typeof Controlled] = value as any;
    });
  });

  afterAll(() => {
    Object.entries(OriginalCurrent).forEach(([key, value]) => {
      Controlled[key as keyof typeof Controlled] = value as any;
    });
  });

  it("Current environment can be overridden with mock NetworkMonitorClient", (done) => {
    Controlled.networkMonitorClient = NetworkMonitorClient.unsatisfied();

    Controlled.networkMonitorClient.subscribe((path) => {
      expect(path.status).toBe("unsatisfied");
      done();
    });
  });
});
