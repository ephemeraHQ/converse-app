import { InternalContext } from "@utils/contextMenu/internalContext";
import { useContext } from "react";

export const useInternal = () => useContext(InternalContext);
