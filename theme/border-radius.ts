export const borderRadius = {
  xs: 8,
  sm: 16,
  md: 24,

  message: {
    bubble: 16,
    attachment: 16,
  },
} as const;

export type IBorderRadius = typeof borderRadius;

/**
 * TIP:
 * When nesting elements inside a parent component with rounded corners, you need to adjust their border radius
 * to match the parent's curvature. To calculate the correct border radius for nested elements:
 * 1. Take the parent's border radius
 * 2. Subtract half of the horizontal padding used in the nested element
 * This ensures nested elements flow smoothly with the parent's rounded corners.
 */
