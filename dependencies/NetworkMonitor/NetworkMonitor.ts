import NetInfo from "@react-native-community/netinfo"
import { BehaviorSubject, Observable, PartialObserver, Subscription } from "rxjs"
import { distinctUntilChanged, shareReplay, switchMap } from "rxjs/operators"

/*
 * NetworkMonitorClient provides a flexible API to monitor
 * network availability. It allows for dynamic control of
 * the network dependency at runtime, whether in tests or
 * live environments. Subscribers do not need to know about
 * the underlying implementation, allowing developers to
 * change the functionality easily as needed.
 *
 * Example usage:
 *
 * // In production
 * const networkMonitor = NetworkMonitorClient.live();
 *
 * // In tests
 * const networkMonitor = NetworkMonitorClient.satisfied();
 *
 * Subscribers can subscribe to network state changes without
 * worrying about the underlying implementation.
 */

/*
 * Represents the current state of network availability.
 *
 * Possible statuses:
 * - 'satisfied': Network is available.
 * - 'unsatisfied': Network is unavailable.
 * - 'unknown': Network state is unknown.
 */
export type NetworkAvailability = {
  status: "satisfied" | "unsatisfied" | "unknown"
}

/*
 * NetworkMonitorClient provides an interface to monitor
 * and control the network state. It uses RxJS Observables
 * to allow subscribers to react to network state changes.
 *
 * This class supports different implementations for various
 * scenarios such as live monitoring, fixed states for testing,
 * and custom behaviors. By abstracting the underlying
 * implementation, subscribers can remain agnostic to how the
 * network state is provided.
 *
 * The network state can be dynamically controlled at runtime,
 * which is useful for testing or simulating network conditions.
 *
 * This class uses the singleton pattern to ensure that only
 * one instance of NetworkMonitorClient exists throughout the
 * application. This is important because it maintains a single
 * source of truth for the network state and allows for consistent
 * behavior across different parts of the application.
 */
export class NetworkMonitorClient {
  /*
   * Singleton instance of NetworkMonitorClient.
   * Ensures that only one instance exists throughout
   * the application.
   */
  private static instance: NetworkMonitorClient

  /*
   * Subject that holds the current Observable<NetworkAvailability>.
   * Allows dynamic switching of the network observable at runtime.
   */
  private networkObservableSubject: BehaviorSubject<Observable<NetworkAvailability>>

  /*
   * Observable that emits the network availability status.
   * Subscribers can subscribe to this Observable to get updates.
   */
  private networkObservable: Observable<NetworkAvailability>

  /*
   * Private constructor to enforce singleton pattern.
   * Initializes the network observable with the given
   * initial observable.
   *
   * @param initialObservable - Initial Observable<NetworkAvailability>
   */
  private constructor(initialObservable: Observable<NetworkAvailability>) {
    this.networkObservableSubject = new BehaviorSubject(initialObservable)

    /*
     * The networkObservable is built by piping the
     * networkObservableSubject through several RxJS
     * operators:
     *
     * 1. switchMap:
     *    - Flattens the higher-order observable (observable of observables)
     *      by switching to the latest emitted observable.
     *    - Ensures that subscribers receive values from the
     *      most recent observable provided to the subject.
     *
     * 2. distinctUntilChanged:
     *    - Prevents emitting duplicate consecutive network statuses.
     *    - Only emits when the network status changes.
     *
     * 3. shareReplay(1):
     *    - Shares the observable among multiple subscribers.
     *    - Replays the last emitted value to new subscribers.
     *    - Ensures that all subscribers receive the latest network status
     *      without causing multiple subscriptions to the source observable.
     */
    this.networkObservable = this.networkObservableSubject.pipe(
      switchMap((observable) => observable),
      distinctUntilChanged((a, b) => a.status === b.status),
      shareReplay(1),
    )
  }

  /*
   * Gets the singleton instance of NetworkMonitorClient.
   * If no instance exists, it initializes one with an
   * unimplemented observable to catch unintended usage.
   *
   * This method is kept private to enforce the use of
   * predefined static methods like live(), satisfied(),
   * etc., for obtaining the instance.
   *
   * @returns The singleton instance of NetworkMonitorClient.
   */
  private static getInstance(): NetworkMonitorClient {
    if (!NetworkMonitorClient.instance) {
      // Default to unimplemented to catch any unintended usage
      NetworkMonitorClient.instance = new NetworkMonitorClient(
        NetworkMonitorClient.unimplementedObservable(),
      )
    }
    return NetworkMonitorClient.instance
  }

  /*
   * Subscribes to network state changes.
   *
   * This method supports both observer objects and
   * next callback functions.
   *
   * @param observer - An observer object with next, error, and complete callbacks.
   * @returns A subscription object that can be used to unsubscribe.
   *
   * Example:
   *
   * networkMonitor.subscribe({
   *   next: (networkAvailability) => {
   *     console.log(networkAvailability.status);
   *   },
   *   error: (error) => {
   *     console.error(error);
   *   },
   *   complete: () => {
   *     console.log('Subscription complete');
   *   }
   * });
   *
   * Or using a next callback:
   *
   * networkMonitor.subscribe((networkAvailability) => {
   *   console.log(networkAvailability.status);
   * });
   */
  subscribe(observer: PartialObserver<NetworkAvailability>): Subscription
  subscribe(next: (value: NetworkAvailability) => void): Subscription
  subscribe(
    observerOrNext: PartialObserver<NetworkAvailability> | ((value: NetworkAvailability) => void),
  ): Subscription {
    if (typeof observerOrNext === "function") {
      return this.networkObservable.subscribe(observerOrNext)
    }
    return this.networkObservable.subscribe(observerOrNext)
  }

  /*
   * Sets the internal observable to a new one.
   * Allows dynamic switching of the network observable.
   *
   * @param observable - The new Observable<NetworkAvailability> to switch to.
   */
  private setNetworkObservable(observable: Observable<NetworkAvailability>) {
    this.networkObservableSubject.next(observable)
  }

  /*
   * Creates a NetworkMonitorClient that monitors real
   * network state changes using NetInfo from
   * '@react-native-community/netinfo'.
   *
   * This is typically used in production environments.
   *
   * Marble Diagram:
   *
   *   [Network State Changes] ----> (satisfied) ----> (unsatisfied) ----> ...
   *
   * Example:
   *
   * const networkMonitor = NetworkMonitorClient.live();
   * networkMonitor.subscribe((state) => {
   *   console.log(state.status);
   * });
   */
  static live(): NetworkMonitorClient {
    const liveObservable = new Observable<NetworkAvailability>((subscriber) => {
      const fetchAndUpdateNetworkState = () => {
        NetInfo.fetch().then((state) => {
          const networkState: NetworkAvailability = {
            status: state.isConnected ? "satisfied" : "unsatisfied",
          }
          subscriber.next(networkState)
        })
      }

      fetchAndUpdateNetworkState()

      const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        const networkState: NetworkAvailability = {
          status: state.isConnected ? "satisfied" : "unsatisfied",
        }
        subscriber.next(networkState)
      })

      return () => {
        unsubscribeNetInfo()
      }
    }).pipe(
      distinctUntilChanged((a, b) => a.status === b.status),
      shareReplay(1),
    )

    NetworkMonitorClient.getInstance().setNetworkObservable(liveObservable)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Creates a NetworkMonitorClient that always emits
   * a 'satisfied' network state.
   *
   * Useful for testing scenarios where a stable network
   * connection is assumed.
   *
   * Marble Diagram:
   *
   *   (satisfied) ----> (satisfied) ----> (satisfied) ----> ...
   *
   * Example:
   *
   * const networkMonitor = NetworkMonitorClient.satisfied();
   */
  static satisfied(): NetworkMonitorClient {
    const satisfiedObservable = new BehaviorSubject<NetworkAvailability>({
      status: "satisfied",
    })

    NetworkMonitorClient.getInstance().setNetworkObservable(satisfiedObservable)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Creates a NetworkMonitorClient that always emits
   * an 'unsatisfied' network state.
   *
   * Useful for testing scenarios where no network
   * connection is available.
   *
   * Marble Diagram:
   *
   *   (unsatisfied) ----> (unsatisfied) ----> (unsatisfied) ----> ...
   *
   * Example:
   *
   * const networkMonitor = NetworkMonitorClient.unsatisfied();
   */
  static unsatisfied(): NetworkMonitorClient {
    const unsatisfiedObservable = new BehaviorSubject<NetworkAvailability>({
      status: "unsatisfied",
    })

    NetworkMonitorClient.getInstance().setNetworkObservable(unsatisfiedObservable)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Creates a NetworkMonitorClient that alternates between
   * 'satisfied' and 'unsatisfied' states every 2 seconds.
   *
   * Useful for testing scenarios with unstable network conditions.
   *
   * Marble Diagram:
   *
   *   (satisfied) ----2s----> (unsatisfied) ----2s----> (satisfied) ----> ...
   *
   * Example:
   *
   * const networkMonitor = NetworkMonitorClient.flakey();
   */
  static flakey(): NetworkMonitorClient {
    const subject = new BehaviorSubject<NetworkAvailability>({
      status: "satisfied",
    })
    let isSatisfied = true

    setInterval(() => {
      isSatisfied = !isSatisfied
      subject.next({ status: isSatisfied ? "satisfied" : "unsatisfied" })
    }, 2000)

    NetworkMonitorClient.getInstance().setNetworkObservable(subject)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Creates a NetworkMonitorClient with custom behavior.
   * Useful for complex testing scenarios or simulations.
   *
   * @param observable - A custom Observable<NetworkAvailability>
   *
   * Example:
   *
   * const customObservable = new Observable<NetworkAvailability>((subscriber) => {
   *   // Custom logic here
   * });
   *
   * const networkMonitor = NetworkMonitorClient.custom(customObservable);
   */
  static custom(observable: Observable<NetworkAvailability>): NetworkMonitorClient {
    NetworkMonitorClient.getInstance().setNetworkObservable(observable)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Creates a NetworkMonitorClient that throws an error
   * when used. Useful for ensuring that tests explicitly
   * provide implementations for all dependencies.
   *
   * Example:
   *
   * const networkMonitor = NetworkMonitorClient.unimplemented();
   */
  static unimplemented(): NetworkMonitorClient {
    const unimplementedObservable = NetworkMonitorClient.unimplementedObservable()
    NetworkMonitorClient.getInstance().setNetworkObservable(unimplementedObservable)
    return NetworkMonitorClient.getInstance()
  }

  /*
   * Internal method to create an unimplemented observable.
   * Emits an error when subscribed to.
   */
  private static unimplementedObservable(): Observable<NetworkAvailability> {
    return new Observable<NetworkAvailability>((subscriber) => {
      subscriber.error(
        new Error(
          "[NetworkMonitor] ERROR: unimplemented - Your code has subscribed to NetworkMonitor " +
            "without specifying an implementation. This unimplemented dependency is here to " +
            "ensure you don't invoke code you don't intend to, ensuring your tests are truly " +
            "testing what they are expected to",
        ),
      )
    }).pipe(shareReplay(1))
  }
}
