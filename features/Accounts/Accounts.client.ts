/**
 * Note: This Client is not currently yet being used and requires some
 * refactoring to synchronously access current state without
 * transitively importing unwanted dependencies.
 *
 * Keeping it here for future use.
 *
 * Naming Conventions:
 *
 * Fetch: fetches data from the server or over the network somehow
 * Create: creates data on the server or over the network somehow
 * Get:   gets data from some local cache or storage
 * Save:  saves data to some local cache or storage
 */

export class AccountsClient {
  getCurrentAccountAddress: () => string;

  constructor(getCurrentAccountAddress: () => string) {
    this.getCurrentAccountAddress = getCurrentAccountAddress;
  }

  static live(): AccountsClient {
    console.log("live baby live");
    let currentAccount: () => string;
    import("@data/store/accountsStore").then((m) => {
      console.log({ m });
      currentAccount = m.currentAccount;
    });

    const liveGetCurrentAddress = () => {
      const liveCurrentAccount = currentAccount();
      console.log({ liveCurrentAccount });
      return liveCurrentAccount;
    };

    return new AccountsClient(liveGetCurrentAddress);
  }

  static fixture(): AccountsClient {
    const fixtureGetCurrentAddress = () => {
      return "0x123";
    };

    return new AccountsClient(fixtureGetCurrentAddress);
  }

  static unimplemented(): AccountsClient {
    const unimplementedError = (method: string) => () => {
      const error = `
[AccountsClient] ERROR: unimplemented ${method} - Your code has invoked AccountsClient 
without specifying an implementation. This unimplemented dependency is here to 
ensure you don't invoke code you don't intend to, ensuring your tests are truly 
testing what they are expected to
`;
      console.warn(error);
      throw new Error(error);
    };

    return new AccountsClient(unimplementedError("getCurrentAccount"));
  }
}
