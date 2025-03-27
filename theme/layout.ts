import { Dimensions } from "react-native"

const window = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height,
}

export const layout = {
  screen: {
    width: window.width,
    height: window.height,
  },

  // Grid systems
  grid: {
    getColumnWidth: ({
      totalColumns,
      horizontalPadding,
      gap,
    }: {
      totalColumns: number
      horizontalPadding: number
      gap: number
    }) => {
      return (window.width - horizontalPadding * 2 - gap * (totalColumns - 1)) / totalColumns
    },
  },
}

export type ILayout = typeof layout
