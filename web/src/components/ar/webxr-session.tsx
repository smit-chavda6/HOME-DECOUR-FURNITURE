"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Undo2, X } from "lucide-react";
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { cn, formatPrice } from "@/lib/utils";
import type { ArProduct } from "./ar-types";

/** Can this browser run floor-tracking AR (WebXR "immersive-ar" with hit testing)? */
export async function isWebXrArSupported() {
  try {
    return Boolean(await navigator.xr?.isSessionSupported("immersive-ar"));
  } catch {
    return false;
  }
}

/** Load a model once and keep it, normalised to real width with its base at y = 0. */
const cache = new Map<string, Promise<Object3D>>();
function loadModel(product: ArProduct) {
  const key = `${product.modelUrl}|${product.widthMetres}`;
  if (!cache.has(key)) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    cache.set(
      key,
      loader.loadAsync(product.modelUrl).then((gltf) => {
        const model = gltf.scene;
        const box = new Box3().setFromObject(model);
        const size = box.getSize(new Vector3());
        const scale = product.widthMetres / Math.max(size.x, size.z, 1e-3);
        const center = box.getCenter(new Vector3());
        const holder = new Group();
        model.position.set(-center.x, -box.min.y, -center.z);
        holder.add(model);
        holder.scale.setScalar(scale);
        return holder;
      }),
    );
  }
  return cache.get(key)!;
}

type WebXrSessionProps = {
  products: ArProduct[];
  initialSlug?: string | null;
  onClose: () => void;
};

/**
 * True AR with floor tracking, for browsers that support WebXR (Chrome on
 * ARCore Android phones). A ring marks the floor; tapping the screen places
 * the chosen piece there at real size. Several pieces can be placed.
 */
export function WebXrSession({ products, initialSlug, onClose }: WebXrSessionProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const initial = products.find((p) => p.slug === initialSlug) ?? products[0];
  const currentRef = useRef<ArProduct | undefined>(initial);
  const placedRef = useRef<Object3D[]>([]);
  const sceneRef = useRef<Scene | null>(null);

  const [current, setCurrent] = useState<ArProduct | undefined>(initial);
  const [status, setStatus] = useState<"starting" | "searching" | "ready" | "error">("starting");
  const [placedCount, setPlacedCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!overlay.current || !navigator.xr) return;
    let session: XRSession | null = null;
    let hitSource: XRHitTestSource | undefined;
    let ended = false;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    const scene = new Scene();
    sceneRef.current = scene;
    const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);
    scene.add(new HemisphereLight(0xffffff, 0xbbbbff, 2.2));
    scene.add(new AmbientLight(0xffffff, 0.4));
    const sun = new DirectionalLight(0xffffff, 1.2);
    sun.position.set(1, 3, 2);
    scene.add(sun);

    const reticle = new Mesh(
      new RingGeometry(0.12, 0.15, 48).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: 0xe3a56f }),
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Taps on our buttons must not also place furniture.
    const stopSelect = (e: Event) => e.preventDefault();
    const uiParts = [controls.current, tray.current].filter((el): el is HTMLDivElement => Boolean(el));
    uiParts.forEach((el) => el.addEventListener("beforexrselect", stopSelect));

    const place = async () => {
      const product = currentRef.current;
      if (!reticle.visible || !product) return;
      const position = new Vector3();
      position.setFromMatrixPosition(reticle.matrix);
      const template = await loadModel(product);
      const piece = template.clone(true);
      piece.position.copy(position);
      // Face the viewer.
      const camPos = new Vector3().setFromMatrixPosition(camera.matrixWorld);
      piece.rotation.y = Math.atan2(camPos.x - position.x, camPos.z - position.z);
      scene.add(piece);
      placedRef.current.push(piece);
      setPlacedCount(placedRef.current.length);
    };

    const start = async () => {
      try {
        session = await navigator.xr!.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay"],
          domOverlay: { root: overlay.current! },
        });
        renderer.xr.setReferenceSpaceType("local");
        await renderer.xr.setSession(session);
        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitSource = await session.requestHitTestSource?.({ space: viewerSpace });
        session.addEventListener("select", place);
        session.addEventListener("end", () => {
          ended = true;
          onClose();
        });
        setStatus("searching");
        // Warm up the first model while the floor is found.
        if (currentRef.current) loadModel(currentRef.current);

        renderer.setAnimationLoop((_, frame) => {
          if (frame && hitSource) {
            const space = renderer.xr.getReferenceSpace();
            const hits = frame.getHitTestResults(hitSource);
            const pose = space && hits[0]?.getPose(space);
            if (pose) {
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
              setStatus((s) => (s === "searching" ? "ready" : s));
            } else {
              reticle.visible = false;
            }
          }
          renderer.render(scene, camera);
        });
      } catch (e) {
        setError((e as Error).message || "AR could not start.");
        setStatus("error");
      }
    };
    start();

    return () => {
      uiParts.forEach((el) => el.removeEventListener("beforexrselect", stopSelect));
      renderer.setAnimationLoop(null);
      hitSource?.cancel();
      if (session && !ended) session.end().catch(() => {});
      renderer.dispose();
      placedRef.current = [];
    };
  }, [onClose]);

  function undo() {
    const last = placedRef.current.pop();
    if (last) sceneRef.current?.remove(last);
    setPlacedCount(placedRef.current.length);
  }

  return (
    <div ref={overlay} className="fixed inset-0 z-[75] flex flex-col justify-between text-white">
      <div ref={controls} className="flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
        <p className="rounded-full bg-black/55 px-4 py-2 text-sm backdrop-blur">
          {status === "starting" && "Starting AR…"}
          {status === "searching" && "Move your phone slowly to find the floor"}
          {status === "ready" && "Tap the screen to place it"}
          {status === "error" && error}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={placedCount === 0}
            aria-label="Remove the last piece"
            className="grid size-11 place-items-center rounded-full bg-black/55 backdrop-blur disabled:opacity-40"
          >
            <Undo2 className="size-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit AR"
            className="grid size-11 place-items-center rounded-full bg-black/55 backdrop-blur"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {status === "starting" && <LoaderCircle className="mx-auto size-10 animate-spin" aria-hidden />}

      {/* Taps on the product list choose a piece; they never place one. */}
      <div
        ref={tray}
        className="no-scrollbar flex gap-2 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              currentRef.current = p;
              setCurrent(p);
              loadModel(p);
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl p-1.5 pr-3 text-left backdrop-blur",
              current?.id === p.id ? "bg-[#e3a56f] text-black" : "bg-black/55",
            )}
          >
            <span className="relative size-10 overflow-hidden rounded-xl bg-white/10">
              {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
            </span>
            <span>
              <span className="block max-w-28 truncate text-xs font-medium">{p.name}</span>
              <span className="block text-[0.7rem] opacity-70 tabular-nums">{formatPrice(p.price)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
