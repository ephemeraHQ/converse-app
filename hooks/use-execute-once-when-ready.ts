import { useEffect, useRef } from "react";

type Falsy = false | 0 | "" | null | undefined;

// Helper type that removes Falsy from a type
type NonFalsy<T> = Exclude<T, Falsy>;

type UseExecuteOnceWhenReadyArgs<T extends unknown[]> = {
  callback: (
    ...args: { [K in keyof T]: NonFalsy<T[K]> }
  ) => Promise<void> | void;
  deps: [...T];
};

export function useExecuteOnceWhenReady<T extends unknown[]>({
  callback,
  deps,
}: UseExecuteOnceWhenReadyArgs<T>) {
  const hasRunRef = useRef(false);

  useEffect(() => {
    const isReady = deps.every((dep) => Boolean(dep));

    if (isReady && !hasRunRef.current) {
      hasRunRef.current = true;
      // TypeScript now knows these values are non-falsy
      const nonFalsyDeps = deps.filter(Boolean) as {
        [K in keyof T]: NonFalsy<T[K]>;
      };
      callback(...nonFalsyDeps);
    }
    // We intentionally only want to check the dependencies array values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
}
