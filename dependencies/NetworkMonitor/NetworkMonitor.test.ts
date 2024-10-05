import { Subject } from "rxjs";

import {
  type NetworkAvailability,
  NetworkMonitorClient,
} from "./NetworkMonitor";
import { Controlled } from "../Environment/Environment";

jest.setTimeout(10);

describe("NetworkMonitorClient", () => {
  let OriginalCurrent: typeof Controlled;
  beforeEach(() => {
    OriginalCurrent = { ...Controlled };
  });

  afterEach(() => {
    Object.entries(OriginalCurrent).forEach(([key, value]) => {
      // todo fix this any crap
      Controlled[key as keyof typeof Controlled] = value as any;
    });
  });

  test("Custom networkMonitorClient should emit custom network states", (done) => {
    const subject = new Subject<NetworkAvailability>();
    const networkMonitorClient = NetworkMonitorClient.custom(subject);
    const emittedStates: string[] = [];

    networkMonitorClient.subscribe((path) => {
      emittedStates.push(path.status);

      if (emittedStates.length === 3) {
        expect(emittedStates).toEqual([
          "satisfied",
          "unsatisfied",
          "satisfied",
        ]);
        done();
      }
    });

    subject.next({ status: "satisfied" });
    subject.next({ status: "unsatisfied" });
    subject.next({ status: "satisfied" });
  });

  describe("Types and Ergonomics", () => {
    test("Can subscribe with simple callback", () => {
      const networkMonitorClient = NetworkMonitorClient.satisfied();

      networkMonitorClient.subscribe((status) => {
        expect(status).toStrictEqual({ status: "satisfied" });
      });
    });
  });

  test("Can subscribe with partial observer", () => {
    const statuses: string[] = [];
    NetworkMonitorClient.satisfied().subscribe({
      next: (status) => {
        expect(status).toStrictEqual({ status: "satisfied" });
        statuses.push(status.status);
      },
    });

    NetworkMonitorClient.unsatisfied().subscribe({
      next: (status) => {
        expect(status).toStrictEqual({ status: "unsatisfied" });
        statuses.push(status.status);
      },
    });

    expect(statuses).toEqual(["satisfied", "unsatisfied"]);
  });
});
