import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";
import { useState, useEffect } from "react";

const THRESHOLD = 4; // Adjust this value based on your sensitivity preference
const SHAKE_WINDOW = 1000; // Time window for detecting shakes (in milliseconds)

export const useDoOnShake = (onShake: () => void) => {
  const [data, setData] = useState<AccelerometerMeasurement | undefined>(
    undefined
  );
  const [shakeTimestamp, setShakeTimestamp] = useState(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((accelerometerData) => {
      setData(accelerometerData);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!data) return;
    const { x, y, z } = data;
    const acceleration = Math.sqrt(x * x + y * y + z * z);

    if (acceleration >= THRESHOLD) {
      const now = Date.now();
      if (now - shakeTimestamp > SHAKE_WINDOW) {
        onShake();
        setShakeTimestamp(now);
      }
    }
  }, [data, onShake, shakeTimestamp]);
};
