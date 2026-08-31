"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import { cn } from "@/lib/utils";
import { formatMoney, type Project, type ProjectStatus } from "@/lib/types";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: "#9aa7b5",
  planned: "#ffdc26",
  in_progress: "#ff9a5c",
  done: "#3cdbc8",
};

/* ---------- Materials palette ---------- */
const WALL = "#f3f1ea";
const WALL_DARK = "#3a423c";
const ROOF = "#272d29";
const GLASS = "#2c3437";
const WOOD = "#b9895c";
const TRIM = "#20261f";

function Window({
  position,
  size = [0.5, 0.42],
  rotation = [0, 0, 0],
  lit = true,
}: {
  position: [number, number, number];
  size?: [number, number];
  rotation?: [number, number, number];
  lit?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.011]}>
        <boxGeometry args={[size[0], size[1], 0.025]} />
        <meshStandardMaterial
          color={GLASS}
          roughness={0.05}
          metalness={0.4}
          emissive={lit ? "#ffd98a" : "#0c0f10"}
          emissiveIntensity={lit ? 0.45 : 0.05}
        />
      </mesh>
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#7a5c3f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshStandardMaterial color="#5d8054" roughness={0.85} />
      </mesh>
      <mesh position={[0.12, 1.0, 0.05]} castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#6b9160" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Shrub({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.14, 14, 14]} />
      <meshStandardMaterial color="#68905d" roughness={0.9} />
    </mesh>
  );
}

function HouseModel() {
  return (
    <group>
      {/* Lawn */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.1, 4.1, 0.1, 64]} />
        <meshStandardMaterial color="#9cb894" roughness={1} />
      </mesh>
      {/* Base plinth */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[4.11, 4.11, 0.02, 64]} />
        <meshStandardMaterial color="#8fae87" roughness={1} />
      </mesh>

      {/* Driveway */}
      <mesh position={[1.6, 0.005, 2.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.35, 2.1]} />
        <meshStandardMaterial color="#c6c9c0" roughness={0.95} />
      </mesh>
      {/* Front path */}
      <mesh position={[-0.35, 0.005, 1.95]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.5, 1.5]} />
        <meshStandardMaterial color="#d2d4cb" roughness={0.95} />
      </mesh>

      {/* Main volume — first floor */}
      <mesh position={[-0.35, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 1.1, 2.4]} />
        <meshStandardMaterial color={WALL} roughness={0.8} />
      </mesh>
      {/* First floor roof ledge */}
      <mesh position={[-0.35, 1.12, 0]} castShadow>
        <boxGeometry args={[2.86, 0.07, 2.56]} />
        <meshStandardMaterial color={ROOF} roughness={0.7} />
      </mesh>

      {/* Second floor — stepped back, dark cladding */}
      <mesh position={[-0.35, 1.6, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.9, 2.1]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.75} />
      </mesh>
      {/* Top roof */}
      <mesh position={[-0.35, 2.09, -0.15]} castShadow>
        <boxGeometry args={[2.88, 0.08, 2.26]} />
        <meshStandardMaterial color={ROOF} roughness={0.7} />
      </mesh>

      {/* Garage */}
      <mesh position={[1.6, 0.45, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.9, 1.5]} />
        <meshStandardMaterial color={WALL} roughness={0.8} />
      </mesh>
      <mesh position={[1.6, 0.93, 0.45]} castShadow>
        <boxGeometry args={[1.44, 0.06, 1.64]} />
        <meshStandardMaterial color={ROOF} roughness={0.7} />
      </mesh>
      {/* Garage door */}
      <mesh position={[1.6, 0.4, 1.21]}>
        <boxGeometry args={[0.95, 0.62, 0.03]} />
        <meshStandardMaterial color="#d8d5cb" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Garage door slats */}
      {[0.22, 0.38, 0.54].map((y) => (
        <mesh key={y} position={[1.6, y, 1.235]}>
          <boxGeometry args={[0.95, 0.015, 0.01]} />
          <meshStandardMaterial color="#b9b5a8" />
        </mesh>
      ))}

      {/* Front door with cedar surround */}
      <mesh position={[-0.35, 0.5, 1.21]}>
        <boxGeometry args={[0.52, 0.86, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[-0.42, 0.47, 1.245]}>
        <boxGeometry args={[0.3, 0.74, 0.02]} />
        <meshStandardMaterial color={TRIM} roughness={0.4} />
      </mesh>
      {/* Porch light */}
      <mesh position={[-0.08, 0.72, 1.24]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffcf5e" emissiveIntensity={1.4} />
      </mesh>

      {/* First floor windows — front */}
      <Window position={[0.45, 0.62, 1.215]} size={[0.72, 0.5]} />
      <Window position={[-1.15, 0.62, 1.215]} size={[0.6, 0.5]} />
      {/* Side windows */}
      <Window position={[-1.71, 0.6, -0.4]} rotation={[0, -Math.PI / 2, 0]} size={[0.6, 0.44]} />
      <Window position={[-1.71, 0.6, 0.5]} rotation={[0, -Math.PI / 2, 0]} size={[0.5, 0.44]} />
      {/* Second floor windows — front band */}
      <Window position={[-1.05, 1.62, 0.905]} size={[0.55, 0.4]} />
      <Window position={[-0.3, 1.62, 0.905]} size={[0.55, 0.4]} />
      <Window position={[0.45, 1.62, 0.905]} size={[0.55, 0.4]} />
      {/* Second floor side windows */}
      <Window position={[-1.71, 1.62, -0.3]} rotation={[0, -Math.PI / 2, 0]} size={[0.5, 0.4]} />
      <Window position={[1.01, 1.62, 0.35]} rotation={[0, Math.PI / 2, 0]} size={[0.5, 0.4]} />
      {/* Back windows */}
      <Window position={[-0.9, 0.62, -1.215]} rotation={[0, Math.PI, 0]} size={[0.8, 0.5]} />
      <Window position={[0.35, 0.62, -1.215]} rotation={[0, Math.PI, 0]} size={[0.6, 0.5]} />
      <Window position={[-0.35, 1.62, -1.215]} rotation={[0, Math.PI, 0]} size={[1.3, 0.42]} />

      {/* Back deck */}
      <mesh position={[-0.9, 0.13, -1.75]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.07, 1.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      {[
        [-1.75, -1.35],
        [-1.75, -2.2],
        [-0.05, -1.35],
        [-0.05, -2.2],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.05, z]}>
          <boxGeometry args={[0.06, 0.12, 0.06]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
      ))}
      {/* Deck rail */}
      <mesh position={[-0.9, 0.32, -2.25]}>
        <boxGeometry args={[1.8, 0.03, 0.03]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>

      {/* Chimney */}
      <mesh position={[-1.2, 2.3, -0.5]} castShadow>
        <boxGeometry args={[0.22, 0.5, 0.22]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.8} />
      </mesh>

      {/* Landscaping */}
      <Tree position={[-2.6, 0, 1.6]} />
      <Tree position={[2.9, 0, -1.1]} scale={0.85} />
      <Tree position={[-2.9, 0, -1.4]} scale={1.15} />
      <Shrub position={[-0.95, 0.1, 1.5]} />
      <Shrub position={[0.25, 0.1, 1.5]} />
      <Shrub position={[2.4, 0.1, 1.35]} />
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
  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [5.4, 3.4, 6.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <hemisphereLight args={["#ffffff", "#c8d4c0", 0.5]} />
        <directionalLight
          position={[6, 9, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-5, 4, -4]} intensity={0.35} color="#ffe6c4" />

        <Suspense fallback={null}>
          <SlowSpin enabled={autoRotate}>
            <HouseModel />
            {onSelect &&
              projects
                .filter((p) => p.hotspot)
                .map((p) => (
                  <Hotspot
                    key={p.id}
                    project={p}
                    selected={selectedId === p.id}
                    onSelect={onSelect}
                  />
                ))}
          </SlowSpin>
          <ContactShadows position={[0, -0.09, 0]} opacity={0.35} scale={12} blur={2.4} far={3} />
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
