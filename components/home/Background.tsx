"use client";

import { useEffect } from "react";

type BackgroundController = {
  updateScroll?: (progress: number) => void;
  destroy?: () => void;
};

export default function Background() {
  useEffect(() => {
    let controller: BackgroundController | null = null;
    let isMounted = true;

    const initializeBackground = async () => {
      try {
        const scene = await import("@/three/bgScene");

        if (!isMounted) return;

        controller = scene.initBackgroundScene() as BackgroundController;
      } catch (error) {
        console.error("Background initialization failed:", error);
      }
    };

    initializeBackground();

    return () => {
      isMounted = false;
      controller?.destroy?.();
      controller = null;
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      <canvas
        id="bg-canvas"
        className="block h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}