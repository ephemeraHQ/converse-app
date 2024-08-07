import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

const THRESHOLD = 3; // Adjust this value based on your sensitivity preference
const SHAKE_WINDOW = 1000; // Time window for detecting shakes (in milliseconds)

export const useDoOnShake = (onShake: () => void) => {
  const shakeTimestamp = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(300);

    const subscription = Accelerometer.addListener((data) => {
      if (!data) return;

      const handleShake = () => {
        const { x, y, z } = data;
        const acceleration = Math.abs(x) + Math.abs(y) + Math.abs(z);

        if (acceleration >= THRESHOLD) {
          const now = Date.now();
          if (now - shakeTimestamp.current > SHAKE_WINDOW) {
            onShake();
            shakeTimestamp.current = now;
          }
        }
      };

      const id = requestAnimationFrame(handleShake);
      return () => cancelAnimationFrame(id);
    });

    return () => subscription.remove();
  }, [onShake]);
};
