import { darkPalette } from "@theme/palette"

export const shadow = {
  big: {
    shadowColor: darkPalette.alpha15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 16,
  },
}

export type IShadow = typeof shadow

export type IShadowKey = keyof typeof shadow
