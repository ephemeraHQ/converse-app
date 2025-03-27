import { useShallow } from "zustand/react/shallow"
import { pick } from "../utils/objects"

export function useSelect<S extends object, K extends keyof S>(
  keys: K[],
): (state: S) => Pick<S, K> {
  return useShallow((s) => pick(s, keys))
}
