import { createRef, useRef } from "react";

import { IBottomSheetModalRefType } from "./IBottomSheet.types";

export const useBottomSheetModalRef = () => {
  return useRef<IBottomSheetModalRefType>(null);
};

export const createBottomSheetModalRef = () =>
  createRef<IBottomSheetModalRefType>();
