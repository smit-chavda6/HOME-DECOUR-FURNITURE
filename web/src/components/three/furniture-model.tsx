"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group, type Mesh } from "three";

type FurnitureModelProps = {
  url: string;
  /** Longest side of the model after scaling, in scene units (metres). */
  size?: number;
  /** Real width in metres; when given, it wins over `size` so the piece is life-size. */
  realWidth?: number;
  onReady?: () => void;
} & Omit<React.ComponentProps<"group">, "children">;

/**
 * Loads a .glb and normalises it: centred on the floor (y = 0), scaled to a
 * known size and casting shadows. Each instance gets its own clone, so the
 * same model can be placed several times.
 *
 * Our models are meshopt-compressed; the decoder ships with drei, so nothing
 * is fetched from third-party CDNs (Draco is switched off).
 */
export function FurnitureModel({ url, size = 2, realWidth, onReady, ...groupProps }: FurnitureModelProps) {
  const { scene } = useGLTF(url, false, true);

  const { object, scale, offset } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    const box = new Box3().setFromObject(clone);
    const dims = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const s = realWidth ? realWidth / Math.max(dims.x, dims.z, 1e-3) : size / Math.max(dims.x, dims.y, dims.z, 1e-3);
    // Move the model so its base sits on y = 0 and it is centred on x/z.
    const o = new Vector3(-center.x, -box.min.y, -center.z);
    return { object: clone, scale: s, offset: o };
  }, [scene, size, realWidth]);

  useEffect(() => {
    onReady?.();
  }, [object, onReady]);

  return (
    <group {...groupProps}>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
    </group>
  );
}

/** Start downloading a model early, before it is shown. */
export function preloadModel(url: string) {
  useGLTF.preload(url, false, true);
}

/** Group handle type, re-exported for components that animate the model. */
export type { Group };
