"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

/**
 * Soft photo-studio lighting built from light panels, so no HDR image has to
 * be downloaded. Warm key light, cool rim light, soft floor shadow.
 */
export function StudioLights({ shadowOpacity = 0.55 }: { shadowOpacity?: number }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6}
        color="#ffe2c4"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.6} color="#bcd3ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffe6cf" position={[0, 4, 3]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#e3a56f" position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 5, -6]} scale={3} />
      </Environment>
      <ContactShadows position={[0, 0, 0]} opacity={shadowOpacity} scale={8} blur={2.6} far={3} resolution={512} color="#000000" />
    </>
  );
}
