"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { FurnitureModel } from "@/components/three/furniture-model";
import type { ArProduct } from "./ar-types";

export type PlacedItem = {
  uid: string;
  product: ArProduct;
  x: number;
  z: number;
  /** Rotation around the vertical axis, in radians. */
  rotation: number;
  /** Size multiplier on top of real size (1 = true size). */
  scale: number;
};

type RoomSceneProps = {
  items: PlacedItem[];
  selected: string | null;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, x: number, z: number) => void;
  /** Camera height in metres; lower looks along the floor, higher looks down. */
  cameraHeight: number;
};

/** Keeps the camera aimed at the middle of the floor as its height changes. */
function CameraRig({ height }: { height: number }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.position.set(0, height, 4.2);
    // Aim above the floor so pieces start in the lower part of the picture,
    // where the floor usually is in a room photo.
    camera.lookAt(0, 0.95, 0);
    invalidate();
  }, [camera, height, invalidate]);
  return null;
}

function Item({
  item,
  selected,
  onPointerDown,
}: {
  item: PlacedItem;
  selected: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const radius = (item.product.widthMetres * item.scale) / 2 + 0.08;
  return (
    <group position={[item.x, 0, item.z]} rotation-y={item.rotation} onPointerDown={onPointerDown}>
      <Suspense fallback={null}>
        <FurnitureModel url={item.product.modelUrl} realWidth={item.product.widthMetres * item.scale} />
      </Suspense>
      {selected && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.005}>
          <ringGeometry args={[radius, radius + 0.03, 64]} />
          <meshBasicMaterial color="#e3a56f" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

/**
 * The transparent 3D layer of the AR room, drawn over the camera feed or a
 * room photo. Pieces stand on an invisible floor and can be dragged on it.
 */
export function RoomScene({ items, selected, onSelect, onMove, cameraHeight }: RoomSceneProps) {
  const dragging = useRef<string | null>(null);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, cameraHeight, 4.2], fov: 50 }}
      // preserveDrawingBuffer lets the screenshot button read the rendered image.
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onPointerMissed={() => onSelect(null)}
      onPointerUp={() => (dragging.current = null)}
      onPointerLeave={() => (dragging.current = null)}
      className="!absolute inset-0 touch-none"
    >
      <CameraRig height={cameraHeight} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 3]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={14} blur={2.2} far={2.5} resolution={512} />

      {/* Invisible floor that receives drag movements. */}
      <mesh
        rotation-x={-Math.PI / 2}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          e.stopPropagation();
          onMove(dragging.current, Math.max(-6, Math.min(6, e.point.x)), Math.max(-8, Math.min(2.5, e.point.z)));
        }}
      >
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {items.map((item) => (
        <Item
          key={item.uid}
          item={item}
          selected={item.uid === selected}
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(item.uid);
            dragging.current = item.uid;
          }}
        />
      ))}
    </Canvas>
  );
}
