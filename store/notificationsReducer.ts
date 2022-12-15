import AsyncStorage from "@react-native-async-storage/async-storage";

import { ActionMap } from "./types";

// Product

export type NotificationsType = {
  showNotificationsScreen: boolean;
  status: "undetermined" | "granted" | "denied";
};

export const notificationsInitialState: NotificationsType = {
  showNotificationsScreen: true,
  status: "undetermined",
};

export enum NotificationsDispatchTypes {
  NotificationsShowScreen = "NOTIFICATIONS_SHOW_SCREEN",
  NotificationsStatus = "NOTIFICATIONS_STATUS",
}

type NotificationsPayload = {
  [NotificationsDispatchTypes.NotificationsShowScreen]: {
    show: boolean;
  };
  [NotificationsDispatchTypes.NotificationsStatus]: {
    status: "undetermined" | "granted" | "denied";
  };
};

export type NotificationsActions =
  ActionMap<NotificationsPayload>[keyof ActionMap<NotificationsPayload>];

export const notificationsReducer = (
  state: NotificationsType,
  action: NotificationsActions
): NotificationsType => {
  switch (action.type) {
    case NotificationsDispatchTypes.NotificationsShowScreen: {
      AsyncStorage.setItem(
        "state.notifications.showNotificationsScreen",
        action.payload.show ? "1" : "0"
      );
      return {
        ...state,
        showNotificationsScreen: action.payload.show,
      };
    }
    case NotificationsDispatchTypes.NotificationsStatus: {
      return {
        ...state,
        status: action.payload.status,
      };
    }

    default:
      return state;
  }
};
