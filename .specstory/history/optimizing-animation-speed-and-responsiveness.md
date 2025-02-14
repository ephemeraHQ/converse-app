## SpecStory

## Optimizing Animation Speed and Responsiveness (2/7/2025, 2:55:28 PM)

_**User**_

as you see i have a value fo SICK_STIFNESS and SICK_DAMPING but I realize it's not good engouh and want it faster

---

_**Assistant**_

I'll help you adjust the animation values to make them faster. For spring animations, increasing the stiffness makes the animation snappier, while reducing damping makes it more bouncy. Let's update these values for a faster feel.

```typescript:theme/animations.ts
// existing code...

// Updated values for faster animations
export const SICK_DAMPING = 65; // Reduced from 80 for slightly more bounce
export const SICK_STIFFNESS = 400; // Increased from 200 for faster movement

// ... rest of the existing code remains the same
```

This change will:
1. Double the stiffness (400 vs 200) to make the animations move more quickly to their target position
2. Slightly reduce the damping (65 vs 80) to allow a tiny bit more bounce while still maintaining a professional feel

The higher stiffness value will make all spring animations in the app feel more responsive and snappy. You can adjust these values further based on how it feels in your app:
- If it's too bouncy, increase the damping back towards 80
- If it's still not fast enough, you could increase stiffness further (e.g., to 500)
- If it becomes too rigid, you could reduce stiffness slightly

These values will automatically apply to all the spring animations in your app since they reference these constants.

---



---

