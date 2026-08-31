"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
  SoftShadows,
  Sparkles,
} from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Vignette } from "@react-three/postprocessing";
import { ACESFilmicToneMapping, type Group } from "three";
import { cn } from "@/lib/utils";
import { formatMoney, type Project, type ProjectStatus } from "@/lib/types";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: "#9aa7b5",
  planned: "#ffdc26",
  in_progress: "#ff9a5c",
  done: "#3cdbc8",
};

/* ---------- Materials palette ---------- */
const WALL = "#e8e2d5";
const WALL_DARK = "#39413b";
const ROOF = "#2b312d";
const WOOD = "#a97c50";
const TRIM = "#1d221c";

function Window({
  position,
  size = [0.5, 0.42],
  rotation = [0, 0, 0],
  glow = 1.6,
  mullion = true,
}: {
  position: [number, number, number];
  size?: [number, number];
  rotation?: [number, number, number];
  /** Emissive intensity — vary per room so the house feels inhabited */
  glow?: number;
  mullion?: boolean;
}) {
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <RoundedBox args={[w + 0.07, h + 0.07, 0.045]} radius={0.012} smoothness={3} castShadow>
        <meshStandardMaterial color={TRIM} roughness={0.45} metalness={0.3} />
      </RoundedBox>
      {/* Glass — physical material so the environment reflects in it */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshPhysicalMaterial
          color="#1a2b2c"
          roughness={0.06}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={2.2}
          emissive={glow > 0 ? "#ffb75e" : "#0b1112"}
          emissiveIntensity={glow}
        />
      </mesh>
      {/* Mullions */}
      {mullion && (
        <>
          <mesh position={[0, 0, 0.032]}>
            <boxGeometry args={[0.014, h, 0.008]} />
            <meshStandardMaterial color={TRIM} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.032]}>
            <boxGeometry args={[w, 0.014, 0.008]} />
            <meshStandardMaterial color={TRIM} roughness={0.5} />
          </mesh>
        </>
      )}
      {/* Sill */}
      <mesh position={[0, -h / 2 - 0.045, 0.03]} castShadow>
        <boxGeometry args={[w + 0.11, 0.03, 0.07]} />
        <meshStandardMaterial color="#cfc8b8" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Tree({
  position,
  scale = 1,
  hue = 0,
}: {
  position: [number, number, number];
  scale?: number;
  hue?: number;
}) {
  const canopy = hue === 0 ? "#4c6b47" : hue === 1 ? "#55764e" : "#425f40";
  const canopy2 = hue === 0 ? "#5a7c52" : hue === 1 ? "#61855a" : "#4d6c49";
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.085, 0.6, 10]} />
        <meshStandardMaterial color="#5f4632" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.82, 0]} scale={[1, 0.92, 1]} castShadow>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color={canopy} roughness={1} />
      </mesh>
      <mesh position={[0.16, 1.06, 0.07]} scale={[1, 0.9, 1]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color={canopy2} roughness={1} />
      </mesh>
      <mesh position={[-0.17, 1.0, -0.05]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        <meshStandardMaterial color={canopy2} roughness={1} />
      </mesh>
    </group>
  );
}

function Shrub({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.15, 18, 18]} />
        <meshStandardMaterial color="#4e7048" roughness={1} />
      </mesh>
      <mesh position={[0.1, 0.04, 0.06]} castShadow scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#587d51" roughness={1} />
      </mesh>
    </group>
  );
}

function Bollard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.12, 10]} />
        <meshStandardMaterial color={TRIM} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.018, 10]} />
        <meshStandardMaterial
          color="#ffe4ae"
          emissive="#ffbe63"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HouseModel() {
  return (
    <group>
      {/* Lawn */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[4.15, 4.3, 0.12, 72]} />
        <meshStandardMaterial color="#42604a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <cylinderGeometry args={[4.15, 4.15, 0.012, 72]} />
        <meshStandardMaterial color="#4a6a51" roughness={1} />
      </mesh>

      {/* Driveway */}
      <RoundedBox
        args={[1.4, 0.035, 2.15]}
        radius={0.015}
        position={[1.6, 0.014, 2.25]}
        receiveShadow
      >
        <meshStandardMaterial color="#7b7f78" roughness={0.92} />
      </RoundedBox>
      {/* Front path — stepping pads */}
      {[1.35, 1.75, 2.15, 2.55].map((z) => (
        <RoundedBox
          key={z}
          args={[0.44, 0.03, 0.3]}
          radius={0.012}
          position={[-0.35, 0.014, z]}
          receiveShadow
        >
          <meshStandardMaterial color="#8d9188" roughness={0.85} />
        </RoundedBox>
      ))}
      <Bollard position={[-0.68, 0, 1.5]} />
      <Bollard position={[-0.02, 0, 1.95]} />
      <Bollard position={[-0.68, 0, 2.4]} />

      {/* Main volume — first floor */}
      <RoundedBox
        args={[2.7, 1.1, 2.4]}
        radius={0.02}
        smoothness={4}
        position={[-0.35, 0.55, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL} roughness={0.85} />
      </RoundedBox>
      {/* First floor roof ledge with fascia */}
      <RoundedBox args={[2.92, 0.08, 2.62]} radius={0.02} position={[-0.35, 1.13, 0]} castShadow>
        <meshStandardMaterial color={ROOF} roughness={0.5} metalness={0.35} />
      </RoundedBox>

      {/* Second floor — stepped back, dark cladding */}
      <RoundedBox
        args={[2.7, 0.9, 2.1]}
        radius={0.02}
        smoothness={4}
        position={[-0.35, 1.6, -0.15]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL_DARK} roughness={0.62} />
      </RoundedBox>
      {/* Cladding batten lines */}
      {[-1.5, -1.0, -0.5, 0.0, 0.5].map((x) => (
        <mesh key={x} position={[x - 0.1, 1.6, 0.902]} castShadow>
          <boxGeometry args={[0.016, 0.9, 0.012]} />
          <meshStandardMaterial color="#2f3631" roughness={0.6} />
        </mesh>
      ))}
      {/* Top roof */}
      <RoundedBox args={[2.94, 0.09, 2.34]} radius={0.02} position={[-0.35, 2.1, -0.15]} castShadow>
        <meshStandardMaterial color={ROOF} roughness={0.5} metalness={0.35} />
      </RoundedBox>

      {/* Garage */}
      <RoundedBox
        args={[1.3, 0.9, 1.5]}
        radius={0.02}
        smoothness={4}
        position={[1.6, 0.45, 0.45]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WALL} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.48, 0.07, 1.68]} radius={0.02} position={[1.6, 0.94, 0.45]} castShadow>
        <meshStandardMaterial color={ROOF} roughness={0.5} metalness={0.35} />
      </RoundedBox>
      {/* Garage door — recessed panels */}
      <mesh position={[1.6, 0.4, 1.205]}>
        <boxGeometry args={[0.98, 0.64, 0.03]} />
        <meshStandardMaterial color="#c9c4b6" roughness={0.6} metalness={0.12} />
      </mesh>
      {[0.2, 0.36, 0.52].map((y) => (
        <mesh key={y} position={[1.6, y, 1.222]}>
          <boxGeometry args={[0.88, 0.1, 0.012]} />
          <meshStandardMaterial color="#bab5a6" roughness={0.65} />
        </mesh>
      ))}
      {/* Garage sconce */}
      <mesh position={[1.05, 0.75, 1.23]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial
          color="#ffe4ae"
          emissive="#ffc267"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>

      {/* Porch canopy over the door */}
      <RoundedBox args={[0.8, 0.05, 0.5]} radius={0.015} position={[-0.35, 1.02, 1.35]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </RoundedBox>
      <mesh position={[-0.68, 0.51, 1.52]} castShadow>
        <boxGeometry args={[0.05, 1.02, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[-0.02, 0.51, 1.52]} castShadow>
        <boxGeometry args={[0.05, 1.02, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      {/* Porch step */}
      <RoundedBox args={[0.7, 0.05, 0.32]} radius={0.012} position={[-0.35, 0.028, 1.32]} receiveShadow>
        <meshStandardMaterial color="#8d9188" roughness={0.85} />
      </RoundedBox>

      {/* Front door — warm cedar with handle */}
      <RoundedBox args={[0.5, 0.86, 0.05]} radius={0.012} position={[-0.35, 0.5, 1.212]} castShadow>
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </RoundedBox>
      {[-0.49, -0.35, -0.21].map((x) => (
        <mesh key={x} position={[x, 0.5, 1.24]}>
          <boxGeometry args={[0.1, 0.82, 0.008]} />
          <meshStandardMaterial color="#96683f" roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[-0.17, 0.5, 1.245]}>
        <boxGeometry args={[0.015, 0.24, 0.015]} />
        <meshStandardMaterial color="#d8c9a0" roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Porch pendant light */}
      <mesh position={[-0.35, 0.94, 1.36]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color="#ffe9b0"
          emissive="#ffc25e"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      {/* Warm pool of light at the entry */}
      <pointLight
        position={[-0.35, 0.85, 1.45]}
        intensity={1.6}
        distance={2.6}
        decay={2}
        color="#ffbe6b"
      />

      {/* First floor windows — front */}
      <Window position={[0.45, 0.62, 1.215]} size={[0.72, 0.5]} glow={2.1} />
      <Window position={[-1.15, 0.62, 1.215]} size={[0.6, 0.5]} glow={1.2} />
      {/* Side windows */}
      <Window position={[-1.71, 0.6, -0.4]} rotation={[0, -Math.PI / 2, 0]} size={[0.6, 0.44]} glow={0.8} />
      <Window position={[-1.71, 0.6, 0.5]} rotation={[0, -Math.PI / 2, 0]} size={[0.5, 0.44]} glow={1.7} />
      {/* Second floor windows — front band */}
      <Window position={[-1.05, 1.62, 0.905]} size={[0.55, 0.4]} glow={0.5} />
      <Window position={[-0.3, 1.62, 0.905]} size={[0.55, 0.4]} glow={1.9} />
      <Window position={[0.45, 1.62, 0.905]} size={[0.55, 0.4]} glow={1.1} />
      {/* Second floor side windows */}
      <Window position={[-1.71, 1.62, -0.3]} rotation={[0, -Math.PI / 2, 0]} size={[0.5, 0.4]} glow={1.4} />
      <Window position={[1.01, 1.62, 0.35]} rotation={[0, Math.PI / 2, 0]} size={[0.5, 0.4]} glow={0.6} />
      {/* Back windows */}
      <Window position={[-0.9, 0.62, -1.215]} rotation={[0, Math.PI, 0]} size={[0.8, 0.5]} glow={2.0} />
      <Window position={[0.35, 0.62, -1.215]} rotation={[0, Math.PI, 0]} size={[0.6, 0.5]} glow={1.0} />
      <Window position={[-0.35, 1.62, -1.215]} rotation={[0, Math.PI, 0]} size={[1.3, 0.42]} glow={0.7} />

      {/* Back deck — individual planks */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[-0.9, 0.135, -1.28 - i * 0.105]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.8, 0.045, 0.09]} />
          <meshStandardMaterial
            color={i % 2 ? "#a4794e" : "#9c7148"}
            roughness={0.68}
          />
        </mesh>
      ))}
      {/* Deck posts + rail */}
      {[
        [-1.76, -1.3],
        [-1.76, -2.2],
        [-0.04, -1.3],
        [-0.04, -2.2],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.26, z]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color={TRIM} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.9, 0.4, -2.2]} castShadow>
        <boxGeometry args={[1.77, 0.035, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[-1.76, 0.4, -1.75]} castShadow>
        <boxGeometry args={[0.05, 0.035, 0.95]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[-0.04, 0.4, -1.75]} castShadow>
        <boxGeometry args={[0.05, 0.035, 0.95]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </mesh>
      {/* Deck string-light glow */}
      <pointLight
        position={[-0.9, 0.7, -1.8]}
        intensity={0.9}
        distance={2.2}
        decay={2}
        color="#ffc98a"
      />

      {/* Chimney with cap */}
      <RoundedBox args={[0.24, 0.52, 0.24]} radius={0.015} position={[-1.2, 2.32, -0.5]} castShadow>
        <meshStandardMaterial color={WALL_DARK} roughness={0.7} />
      </RoundedBox>
      <mesh position={[-1.2, 2.6, -0.5]} castShadow>
        <boxGeometry args={[0.3, 0.035, 0.3]} />
        <meshStandardMaterial color={ROOF} roughness={0.5} metalness={0.35} />
      </mesh>

      {/* Landscaping */}
      <Tree position={[-2.6, 0, 1.6]} hue={0} />
      <Tree position={[2.9, 0, -1.1]} scale={0.85} hue={1} />
      <Tree position={[-2.9, 0, -1.4]} scale={1.2} hue={2} />
      <Tree position={[3.1, 0, 1.9]} scale={0.7} hue={1} />
      <Shrub position={[-0.95, 0.08, 1.5]} />
      <Shrub position={[0.25, 0.08, 1.5]} scale={1.15} />
      <Shrub position={[2.4, 0.08, 1.35]} />
      <Shrub position={[-1.9, 0.08, 0.9]} scale={0.85} />

      {/* Fireflies drifting over the yard */}
      <Sparkles
        count={26}
        position={[0, 0.7, 0.6]}
        scale={[7, 1.4, 6]}
        size={2.2}
        speed={0.28}
        opacity={0.55}
        color="#ffd98a"
      />
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
  const color = STATUS_COLOR[project.status];
  const { x, y, z } = project.hotspot;

  return (
    <Html position={[x, y, z]} center zIndexRange={[40, 0]}>
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-label={`${project.title} — ${formatMoney(project.estimatedCost)}`}
        className={cn(
          "hotspot-dot group relative block cursor-pointer rounded-full transition-transform duration-300",
          selected ? "scale-125" : "hover:scale-110"
        )}
        style={{ color }}
      >
        <span
          className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow-lg"
          style={{ background: color }}
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

/** Locally-generated PBR environment — dusk sky reflections without any network fetch. */
function DuskEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Warm sunset band */}
      <Lightformer
        intensity={2.4}
        color="#ffb46b"
        position={[6, 1.6, -4]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[9, 2.4, 1]}
        form="rect"
      />
      {/* Cool teal sky dome */}
      <Lightformer
        intensity={0.9}
        color="#3f7f79"
        position={[0, 7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[14, 14, 1]}
        form="rect"
      />
      {/* Soft fill from the front */}
      <Lightformer
        intensity={0.7}
        color="#9fd8cf"
        position={[-5, 2.4, 6]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[6, 2, 1]}
        form="rect"
      />
    </Environment>
  );
}

export default function HouseScene({
  projects,
  selectedId,
  onSelect,
  autoRotate = false,
  interactive = true,
  className,
}: {
  projects: Project[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  autoRotate?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  // Post-processing only on the full-page scene; the dashboard teaser stays lightweight
  const highQuality = interactive;
  const markers = useMemo(() => projects.filter((p) => p.hotspot), [projects]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5.4, 3.4, 6.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping }}
      >
        {highQuality && <SoftShadows size={22} samples={14} focus={0.6} />}
        <fog attach="fog" args={["#0a191c", 13, 30]} />

        {/* Dusk key light — low warm sun */}
        <directionalLight
          position={[7, 6.5, -4]}
          intensity={2.1}
          color="#ffcf9a"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        {/* Cool ambient bounce */}
        <ambientLight intensity={0.22} color="#bcd8d2" />
        <hemisphereLight args={["#5f8e87", "#1c2a24", 0.55]} />
        {/* Teal rim from the front-left */}
        <directionalLight position={[-6, 3, 5]} intensity={0.5} color="#63c9bc" />

        <Suspense fallback={null}>
          <DuskEnvironment />
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
          <ContactShadows position={[0, -0.11, 0]} opacity={0.55} scale={13} blur={2.2} far={3.4} />

          {highQuality && (
            <EffectComposer multisampling={4}>
              <N8AO aoRadius={0.5} intensity={3.2} distanceFalloff={0.6} quality="medium" />
              <Bloom
                mipmapBlur
                intensity={0.55}
                luminanceThreshold={0.85}
                luminanceSmoothing={0.2}
              />
              <Vignette eskil={false} offset={0.18} darkness={0.72} />
            </EffectComposer>
          )}
        </Suspense>

        <OrbitControls
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
  );
}
