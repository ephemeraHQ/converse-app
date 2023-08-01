import { Frens } from "../../utils/api";
import mmkv from "../../utils/mmkv";
import { ActionMap } from "./types";

// Product

export type RecommendationsType = {
  loading: boolean;
  updatedAt: number;
  frens: Frens;
};

export const recommendationsInitialState: RecommendationsType = {
  loading: false,
  updatedAt: 0,
  frens: {},
};

export enum RecommendationsDispatchTypes {
  SetLoadingRecommendations = "SET_LOADING_RECOMMENDATIONS",
  SetRecommendations = "SET_RECOMMENDATIONS",
  ResetRecommendations = "RESET_RECOMMENDATIONS",
}

type RecommendationsPayload = {
  [RecommendationsDispatchTypes.SetRecommendations]: {
    frens: Frens;
    updatedAt: number;
  };
  [RecommendationsDispatchTypes.SetLoadingRecommendations]: undefined;
  [RecommendationsDispatchTypes.ResetRecommendations]: undefined;
};

export type RecommendationsActions =
  ActionMap<RecommendationsPayload>[keyof ActionMap<RecommendationsPayload>];

export const recommendationsReducer = (
  state: RecommendationsType,
  action: RecommendationsActions
): RecommendationsType => {
  switch (action.type) {
    case RecommendationsDispatchTypes.SetLoadingRecommendations: {
      return {
        ...state,
        loading: true,
      };
    }

    case RecommendationsDispatchTypes.SetRecommendations: {
      mmkv.set("converse-recommendations", JSON.stringify(action.payload));
      return {
        ...state,
        loading: false,
        frens: action.payload.frens,
        updatedAt: action.payload.updatedAt || 0,
      };
    }

    case RecommendationsDispatchTypes.ResetRecommendations: {
      return recommendationsInitialState;
    }

    default:
      return state;
  }
};
