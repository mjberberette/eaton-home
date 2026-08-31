"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { ACESFilmicToneMapping, type Group } from "three";
import { cn } from "@/lib/utils";
import { categoryMeta } from "@/lib/category-meta";
import { formatMoney, type Project, type ProjectStatus } from "@/lib/types";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: "#9aa7b5",
  planned: "#ffdc26",
  in_progress: "#ff9a5c",
  done: "#3cdbc8",
};

/* ---------- Clean architectural palette ---------- */
const WALL = "#f3f3ef";
const SLAB = "#23292c";
const GLASS = "#31404a";
const WOOD = "#b98a5a";
const RAIL = "#d9dcd8";

function Window({
  position,
  size = [0.5, 0.42],
  rotation = [0, 0, 0],
  glow = 0.35,
}: {
  position: [number, number, number];
  size?: [number, number];
  rotation?: [number, number, number];
  /** Subtle interior warmth — keep low for the clean concept look */
  glow?: number;
}) {
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.05, h + 0.05, 0.04]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color={SLAB} roughness={0.4} metalness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshPhysicalMaterial
          color={GLASS}
          roughness={0.05}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={2.6}
          emissive="#ffb75e"
          emissiveIntensity={glow}
        />
      </mesh>
      {/* Single slim mullion */}
      <mesh position={[0, 0, 0.046]}>
        <boxGeometry args={[0.012, h, 0.008]} />
        <meshStandardMaterial color={SLAB} roughness={0.4} />
      </mesh>
    </group>
  );
}

function RailingRun({
  position,
  length,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  length: number;
  rotation?: [number, number, number];
}) {
  const posts = Math.max(2, Math.round(length / 0.35));
  return (
    <group position={position} rotation={rotation}>
      {[0.12, 0.24].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[length, 0.014, 0.014]} />
          <meshStandardMaterial color={RAIL} roughness={0.35} metalness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: posts }, (_, i) => (
        <mesh
          key={i}
          position={[-length / 2 + (i * length) / (posts - 1), 0.12, 0]}
          castShadow
        >
          <boxGeometry args={[0.014, 0.24, 0.014]} />
          <meshStandardMaterial color={RAIL} roughness={0.35} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Gallery-style concept model: crisp white volumes on a dark plinth,
 * no landscaping — the house itself is the object.
 */
function HouseModel() {
  return (
    <group>
      {/* Presentation plinth */}
      <RoundedBox args={[8, 0.16, 6.6]} radius={0.08} position={[0, -0.08, 0.15]} receiveShadow>
        <meshStandardMaterial color="#171d20" roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[7.7, 0.03, 6.3]} radius={0.015} position={[0, 0.012, 0.15]} receiveShadow>
        <meshStandardMaterial color="#1f2629" roughness={0.4} metalness={0.2} />
      </RoundedBox>

      {/* Main volume — first floor */}
      <RoundedBox
        args={[2.7, 1.1, 2.4]}
        radius={0.02}
        smoothness={4}
        position={[-0.35, 0.55, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL} roughness={0.55} />
      </RoundedBox>
      {/* First floor roof slab / balcony deck */}
      <RoundedBox args={[2.92, 0.08, 2.62]} radius={0.02} position={[-0.35, 1.13, 0]} castShadow>
        <meshStandardMaterial color={SLAB} roughness={0.35} metalness={0.3} />
      </RoundedBox>

      {/* Second floor — stepped back */}
      <RoundedBox
        args={[2.7, 0.9, 2.1]}
        radius={0.02}
        smoothness={4}
        position={[-0.35, 1.6, -0.15]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL} roughness={0.55} />
      </RoundedBox>
      {/* Top roof slab */}
      <RoundedBox args={[2.94, 0.09, 2.34]} radius={0.02} position={[-0.35, 2.1, -0.15]} castShadow>
        <meshStandardMaterial color={SLAB} roughness={0.35} metalness={0.3} />
      </RoundedBox>

      {/* Front balcony on the setback, with thin railing */}
      <RailingRun position={[-0.35, 1.17, 1.14]} length={2.8} />
      <RailingRun position={[-1.78, 1.17, 0.42]} length={1.42} rotation={[0, Math.PI / 2, 0]} />
      <RailingRun position={[1.08, 1.17, 0.42]} length={1.42} rotation={[0, Math.PI / 2, 0]} />

      {/* Garage */}
      <RoundedBox
        args={[1.3, 0.9, 1.5]}
        radius={0.02}
        smoothness={4}
        position={[1.6, 0.45, 0.45]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[1.46, 0.07, 1.66]} radius={0.02} position={[1.6, 0.94, 0.45]} castShadow>
        <meshStandardMaterial color={SLAB} roughness={0.35} metalness={0.3} />
      </RoundedBox>
      {/* Sleek dark garage door */}
      <mesh position={[1.6, 0.42, 1.205]}>
        <boxGeometry args={[0.98, 0.66, 0.03]} />
        <meshStandardMaterial color="#2b3236" roughness={0.45} metalness={0.3} />
      </mesh>
      {[0.24, 0.42, 0.6].map((y) => (
        <mesh key={y} position={[1.6, y, 1.232]}>
          <boxGeometry args={[0.98, 0.008, 0.008]} />
          <meshStandardMaterial color="#454d52" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}

      {/* Entry: floating canopy + warm wood door */}
      <RoundedBox args={[0.78, 0.045, 0.5] } radius={0.015} position={[-0.35, 1.0, 1.34]} castShadow>
        <meshStandardMaterial color={SLAB} roughness={0.35} metalness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.86, 0.05]} radius={0.01} position={[-0.35, 0.5, 1.212]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      {[-0.47, -0.35, -0.23].map((x) => (
        <mesh key={x} position={[x, 0.5, 1.248]}>
          <boxGeometry args={[0.09, 0.82, 0.006]} />
          <meshStandardMaterial color="#a4744a" roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[-0.16, 0.5, 1.258]}>
        <boxGeometry args={[0.012, 0.22, 0.012]} />
        <meshStandardMaterial color="#e6d8b8" roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Entry step */}
      <RoundedBox args={[0.66, 0.045, 0.3]} radius={0.012} position={[-0.35, 0.026, 1.34]} receiveShadow>
        <meshStandardMaterial color="#31383c" roughness={0.5} />
      </RoundedBox>
      {/* Soft entry light */}
      <pointLight position={[-0.35, 0.85, 1.42]} intensity={0.9} distance={2} decay={2} color="#ffcf8a" />

      {/* Glazing — large clean panels */}
      {/* First floor front */}
      <Window position={[0.45, 0.58, 1.215]} size={[0.95, 0.72]} glow={0.7} />
      <Window position={[-1.15, 0.58, 1.215]} size={[0.62, 0.72]} glow={0.3} />
      {/* First floor sides */}
      <Window position={[-1.71, 0.56, 0.35]} rotation={[0, -Math.PI / 2, 0]} size={[0.9, 0.68]} glow={0.5} />
      <Window position={[-1.71, 0.56, -0.65]} rotation={[0, -Math.PI / 2, 0]} size={[0.6, 0.68]} glow={0.25} />
      {/* Second floor front band */}
      <Window position={[-1.0, 1.58, 0.905]} size={[0.62, 0.52]} glow={0.2} />
      <Window position={[-0.3, 1.58, 0.905]} size={[0.62, 0.52]} glow={0.65} />
      <Window position={[0.4, 1.58, 0.905]} size={[0.62, 0.52]} glow={0.35} />
      {/* Second floor sides */}
      <Window position={[-1.71, 1.58, -0.2]} rotation={[0, -Math.PI / 2, 0]} size={[0.85, 0.5]} glow={0.4} />
      <Window position={[1.01, 1.58, 0.2]} rotation={[0, Math.PI / 2, 0]} size={[0.85, 0.5]} glow={0.25} />
      {/* Back */}
      <Window position={[-0.75, 0.58, -1.215]} rotation={[0, Math.PI, 0]} size={[1.35, 0.72]} glow={0.6} />
      <Window position={[0.55, 0.58, -1.215]} rotation={[0, Math.PI, 0]} size={[0.55, 0.72]} glow={0.3} />
      <Window position={[-0.35, 1.58, -1.215]} rotation={[0, Math.PI, 0]} size={[1.5, 0.5]} glow={0.35} />

      {/* Back terrace — clean stone platform (deck project lives here) */}
      <RoundedBox args={[1.9, 0.06, 1.1]} radius={0.02} position={[-0.9, 0.03, -1.78]} receiveShadow castShadow>
        <meshStandardMaterial color="#3a4246" roughness={0.55} />
      </RoundedBox>
      <RailingRun position={[-0.9, 0.06, -2.32]} length={1.9} />
    </group>
  );
}

function Hotspot({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  if (!project.hotspot) return null;
  const status = STATUS_COLOR[project.status];
  const { icon: Icon, pastel } = categoryMeta(project.categoryId);
  const { x, y, z } = project.hotspot;

  return (
    <Html position={[x, y, z]} center zIndexRange={[40, 0]}>
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-label={`${project.title} — ${formatMoney(project.estimatedCost)}`}
        className={cn(
          "hotspot-dot group relative block cursor-pointer rounded-full transition-transform duration-300",
          selected ? "scale-115" : "hover:scale-110"
        )}
        style={{ color: status }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.55)] backdrop-blur"
          style={{ background: pastel }}
        >
          <Icon className="h-4 w-4 text-neutral-800" strokeWidth={2} />
        </span>
        {/* Status dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white shadow"
          style={{ background: status }}
        />
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-black/80 px-3 py-1.5 text-[11px] font-light text-white opacity-0 backdrop-blur transition-opacity duration-200",
            selected ? "opacity-100" : "group-hover:opacity-100"
          )}
        >
          {project.title} · {formatMoney(project.estimatedCost)}
        </span>
      </button>
    </Html>
  );
}

function SlowSpin({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (enabled && ref.current) ref.current.rotation.y += delta * 0.12;
  });
  return <group ref={ref}>{children}</group>;
}

/** Locally-generated studio environment — clean gallery reflections, no network fetch. */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Big overhead softbox */}
      <Lightformer
        intensity={1.6}
        color="#ffffff"
        position={[0, 8, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
        form="rect"
      />
      {/* Warm horizon accent (keeps the brand's dusk soul) */}
      <Lightformer
        intensity={1.1}
        color="#ffc98e"
        position={[6, 1.4, -4]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[8, 1.8, 1]}
        form="rect"
      />
      {/* Cool teal fill */}
      <Lightformer
        intensity={0.7}
        color="#7fd4c8"
        position={[-6, 2.5, 5]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[6, 2, 1]}
        form="rect"
      />
    </Environment>
  );
}

export interface HouseSceneHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

export default function HouseScene({
  projects,
  selectedId,
  onSelect,
  autoRotate = false,
  interactive = true,
  className,
  apiRef,
}: {
  projects: Project[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
  /** Receives imperative zoom controls once the scene is ready */
  apiRef?: React.RefObject<HouseSceneHandle | null>;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (!apiRef) return;
    const dolly = (factor: number) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const cam = controls.object;
      const offset = cam.position.clone().sub(controls.target);
      offset.setLength(Math.min(11, Math.max(4.5, offset.length() * factor)));
      cam.position.copy(controls.target).add(offset);
      controls.update();
    };
    apiRef.current = {
      zoomIn: () => dolly(0.78),
      zoomOut: () => dolly(1.28),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);
  // Post-processing only on the full-page scene; the dashboard teaser stays lightweight
  const highQuality = interactive;
  const markers = useMemo(() => projects.filter((p) => p.hotspot), [projects]);

  return (
    // The canvas lives in an absolutely-positioned layer so its measured pixel
    // size never becomes a min-width constraint on the page layout (r3f sets
    // fixed px dimensions on the <canvas> element).
    <div className={cn("relative h-full w-full", className)}>
      <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5.4, 3.4, 6.2], fov: 42 }}
        gl={{
          antialias: true,
          // Opaque canvas: compositing post-processing over a transparent
          // buffer is what caused flicker while orbiting.
          alpha: false,
          toneMapping: ACESFilmicToneMapping,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#0a191c"]} />
        <fog attach="fog" args={["#0a191c", 14, 32]} />

        {/* Neutral studio key */}
        <directionalLight
          position={[6, 8.5, 4]}
          intensity={2.0}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <ambientLight intensity={0.42} color="#dce8e4" />
        <hemisphereLight args={["#cfdcd7", "#141c1e", 0.6]} />
        {/* Teal rim keeps it on-brand against the dark page */}
        <directionalLight position={[-6, 3, -5]} intensity={0.45} color="#63c9bc" />

        <Suspense fallback={null}>
          <StudioEnvironment />
          <SlowSpin enabled={autoRotate}>
            <HouseModel />
            {onSelect &&
              markers.map((p) => (
                <Hotspot
                  key={p.id}
                  project={p}
                  selected={selectedId === p.id}
                  onSelect={onSelect}
                />
              ))}
          </SlowSpin>
          <ContactShadows position={[0, -0.17, 0.15]} opacity={0.6} scale={14} blur={2} far={3.6} />

          {highQuality && (
            <EffectComposer multisampling={4}>
              <Bloom
                mipmapBlur
                intensity={0.35}
                luminanceThreshold={0.9}
                luminanceSmoothing={0.2}
              />
              <Vignette eskil={false} offset={0.18} darkness={0.65} />
            </EffectComposer>
          )}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enabled={interactive}
          minDistance={4.5}
          maxDistance={11}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2.15}
          autoRotate={!interactive}
          autoRotateSpeed={0.6}
          target={[0, 0.9, 0]}
        />
      </Canvas>
      </div>
    </div>
  );
}
