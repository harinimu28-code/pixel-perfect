import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  Html,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useStage, TIMELINE_EVENTS, type StageObject, type Vec3 } from "@/lib/stage-store";
import { AssetMesh } from "./assets";

const D2R = Math.PI / 180;
const registry = new Map<string, THREE.Group>();
let lastGizmoUp = 0;

function useShowState() {
  const t = useStage((s) => s.playhead);
  return useMemo(() => {
    const light = TIMELINE_EVENTS.find((e) => e.track === "Lighting" && t >= e.start && t < e.end);
    const led = TIMELINE_EVENTS.find((e) => e.track === "LED Screen" && t >= e.start && t < e.end);
    const beamMap: Record<string, string> = {
      "Warm Wash": "#ffb36b",
      "Chase FX": "#9b7bff",
      "Spot Podium": "#f4f1ea",
      "Strobe Finale": "#7fd4ff",
    };
    const hueMap: Record<string, number> = {
      "Event Loop": 260,
      "Dance Visuals": 330,
      "Award Slides": 40,
      "Sponsor Reel": 190,
    };
    return {
      beam: light ? beamMap[light.label] ?? "#ffffff" : "#3a3a44",
      hue: led ? hueMap[led.label] ?? 260 : 230,
    };
  }, [t]);
}

function StageItem({ obj, beam, hue }: { obj: StageObject; beam: string; hue: number }) {
  const selected = useStage((s) => s.selectedId === obj.id);
  const select = useStage((s) => s.select);
  return (
    <group
      ref={(g) => {
        if (g) registry.set(obj.id, g);
        else registry.delete(obj.id);
      }}
      position={obj.position}
      rotation={[obj.rotation[0] * D2R, obj.rotation[1] * D2R, obj.rotation[2] * D2R]}
      scale={obj.scale}
      onClick={(e) => {
        e.stopPropagation();
        select(obj.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <AssetMesh type={obj.type} selected={selected} beam={beam} hue={hue} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.55, 0.62, 48]} />
          <meshBasicMaterial color="#8b6cf0" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Gizmo() {
  const selectedId = useStage((s) => s.selectedId);
  const mode = useStage((s) => s.transformMode);
  const objects = useStage((s) => s.objects);
  const update = useStage((s) => s.updateObject);
  const [target, setTarget] = useState<THREE.Group | null>(null);

  useEffect(() => {
    setTarget(selectedId ? registry.get(selectedId) ?? null : null);
  }, [selectedId, objects]);

  if (!target || !selectedId) return null;
  return (
    <TransformControls
      object={target}
      mode={mode}
      size={0.8}
      showY={mode !== "scale"}
      onMouseUp={() => {
        lastGizmoUp = performance.now();
        const p = target.position;
        const r = target.rotation;
        const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
        update(selectedId, {
          position: [round(p.x), round(Math.max(0, p.y)), round(p.z)] as Vec3,
          rotation: [round(r.x / D2R, 1), round(r.y / D2R, 1), round(r.z / D2R, 1)] as Vec3,
          scale: round(Math.max(0.1, target.scale.x)),
        });
      }}
    />
  );
}

function CameraRig() {
  const view = useStage((s) => s.cameraView);
  const nonce = useStage((s) => s.cameraNonce);
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | null;
  };
  useEffect(() => {
    if (!nonce) return;
    const pos: Record<string, Vec3> = {
      perspective: [9, 7, 12],
      top: [0, 18, 0.01],
      front: [0, 3, 15],
      side: [16, 3, 0],
    };
    camera.position.set(...pos[view]);
    controls?.target.set(0, 1, 0);
    controls?.update();
  }, [nonce, view, camera, controls]);
  return null;
}

function Dimension({ from, to, label }: { from: Vec3; to: Vec3; label: string }) {
  const geom = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]),
    [from, to],
  );
  const mid: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (
    <group>
      <lineSegments geometry={geom}>
        <lineBasicMaterial color="#8b6cf0" transparent opacity={0.7} />
      </lineSegments>
      <Html position={mid} center zIndexRange={[10, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-sm border border-primary/40 bg-background/90 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          {label}
        </div>
      </Html>
    </group>
  );
}

function StageSet() {
  const { width, depth, height } = useStage((s) => s.dims);
  const wallH = 6;
  return (
    <group>
      {/* venue floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#141417" roughness={0.95} />
      </mesh>
      {/* deck */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#2b2422" roughness={0.55} />
      </mesh>
      {/* deck top (marley) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.002, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1c1a1c" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* front skirt */}
      <mesh position={[0, height / 2, depth / 2 + 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0d0d10" roughness={1} />
      </mesh>
      {/* edge strip */}
      <mesh position={[0, height + 0.01, depth / 2 - 0.03]}>
        <boxGeometry args={[width, 0.02, 0.05]} />
        <meshStandardMaterial color="#d9c27a" emissive="#d9c27a" emissiveIntensity={0.3} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, wallH / 2, -depth / 2 - 0.15]} receiveShadow>
        <boxGeometry args={[width + 2, wallH, 0.3]} />
        <meshStandardMaterial color="#1a1a1f" roughness={0.9} />
      </mesh>
      {/* truss */}
      <mesh position={[0, wallH - 0.4, 0]} castShadow>
        <boxGeometry args={[width, 0.3, 0.3]} />
        <meshStandardMaterial color="#6b6b72" metalness={0.8} roughness={0.35} wireframe />
      </mesh>
      {/* dimensions */}
      <Dimension
        from={[-width / 2, 0.05, depth / 2 + 0.8]}
        to={[width / 2, 0.05, depth / 2 + 0.8]}
        label={`W ${width.toFixed(1)} m`}
      />
      <Dimension
        from={[width / 2 + 0.8, 0.05, -depth / 2]}
        to={[width / 2 + 0.8, 0.05, depth / 2]}
        label={`D ${depth.toFixed(1)} m`}
      />
      <Dimension
        from={[-width / 2 - 0.5, 0, depth / 2]}
        to={[-width / 2 - 0.5, height, depth / 2]}
        label={`H ${height.toFixed(2)} m`}
      />
    </group>
  );
}

export function StageViewport() {
  const objects = useStage((s) => s.objects);
  const showGrid = useStage((s) => s.showGrid);
  const select = useStage((s) => s.select);
  const { beam, hue } = useShowState();
  const ready = useRef(true);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9, 7, 12], fov: 45 }}
      onPointerMissed={() => {
        if (performance.now() - lastGizmoUp > 250 && ready.current) select(null);
      }}
    >
      <color attach="background" args={["#0e0e11"]} />
      <fog attach="fog" args={["#0e0e11", 25, 60]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#bcb8ff", "#1a1a1a", 0.35]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <spotLight position={[0, 9, 8]} angle={0.5} penumbra={0.6} intensity={60} color="#fff3e0" />
      <Environment resolution={64}>
        <Lightformer intensity={1.2} position={[0, 6, 4]} scale={[10, 4, 1]} />
        <Lightformer intensity={0.6} color="#8b7bff" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>

      <StageSet />
      {objects.map((o) => (
        <StageItem key={o.id} obj={o} beam={beam} hue={hue} />
      ))}
      <Gizmo />

      {showGrid && (
        <Grid
          position={[0, 0.003, 0]}
          args={[60, 60]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#2a2a31"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#3c3650"
          fadeDistance={45}
          infiniteGrid
        />
      )}
      <OrbitControls makeDefault target={[0, 1, 0]} maxPolarAngle={Math.PI / 2.05} minDistance={3} maxDistance={40} />
      <CameraRig />
    </Canvas>
  );
}
