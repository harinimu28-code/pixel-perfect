import type { ReactNode } from "react";
import * as THREE from "three";

/* Lightweight procedural meshes for the expanded built-in catalog. */
const SEL = new THREE.Color("#8b6cf0");
type P = { selected?: boolean | undefined };

function M({ c, s, r = 0.6, m = 0.1, e, ei = 0 }: { c: string; s?: boolean | undefined; r?: number; m?: number; e?: string; ei?: number }) {
  return (
    <meshStandardMaterial
      color={c}
      roughness={r}
      metalness={m}
      emissive={s ? SEL : e ?? "#000000"}
      emissiveIntensity={s ? 0.35 : ei}
    />
  );
}
const Box = ({ p, a, c, s, r, m, e, ei }: { p: [number, number, number]; a: [number, number, number]; c: string; s?: boolean | undefined; r?: number; m?: number; e?: string; ei?: number }) => (
  <mesh position={p} castShadow receiveShadow>
    <boxGeometry args={a} />
    <M c={c} s={s} {...(r !== undefined ? { r } : {})} {...(m !== undefined ? { m } : {})} {...(e ? { e } : {})} {...(ei !== undefined ? { ei } : {})} />
  </mesh>
);
const Cyl = ({ p, a, c, s, rot, m }: { p: [number, number, number]; a: [number, number, number, number?]; c: string; s?: boolean | undefined; rot?: [number, number, number]; m?: number }) => (
  <mesh position={p} rotation={rot ?? [0, 0, 0]} castShadow>
    <cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 24]} />
    <M c={c} s={s} {...(m !== undefined ? { m } : {})} />
  </mesh>
);

const Steps = ({ selected: s }: P) => (
  <group>
    {[0, 1, 2].map((i) => (
      <Box key={i} p={[0, 0.1 + i * 0.1, 0.3 - i * 0.3]} a={[1.2, 0.2 + i * 0.2, 0.3]} c="#2a2a2f" s={s} />
    ))}
  </group>
);
const Backdrop = ({ selected: s }: P) => (
  <group>
    <Box p={[0, 1.5, 0]} a={[4, 3, 0.06]} c="#3a2240" r={0.95} s={s} />
    <Box p={[0, 0.03, 0]} a={[4.2, 0.06, 0.4]} c="#222" s={s} />
  </group>
);
const Truss = ({ selected: s }: P) => (
  <group>
    {[-1.5, 1.5].map((x) => (
      <mesh key={x} position={[x, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#8a8a92" metalness={0.8} roughness={0.35} wireframe emissive={s ? SEL : "#000"} />
      </mesh>
    ))}
    <mesh position={[0, 3, 0]} castShadow>
      <boxGeometry args={[3.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#8a8a92" metalness={0.8} roughness={0.35} wireframe emissive={s ? SEL : "#000"} />
    </mesh>
  </group>
);
const Table = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.74, 0]} a={[0.6, 0.6, 0.04, 32]} c="#e8e2d4" s={s} />
    <Cyl p={[0, 0.37, 0]} a={[0.05, 0.05, 0.72]} c="#555" m={0.7} />
    <Cyl p={[0, 0.02, 0]} a={[0.3, 0.3, 0.04]} c="#444" m={0.7} />
  </group>
);
const Sofa = ({ selected: s }: P) => (
  <group>
    <Box p={[0, 0.22, 0]} a={[1.8, 0.4, 0.8]} c="#2f3b5a" r={0.9} s={s} />
    <Box p={[0, 0.6, -0.32]} a={[1.8, 0.5, 0.16]} c="#2f3b5a" r={0.9} s={s} />
    <Box p={[-0.85, 0.45, 0]} a={[0.16, 0.3, 0.8]} c="#2a3550" r={0.9} s={s} />
    <Box p={[0.85, 0.45, 0]} a={[0.16, 0.3, 0.8]} c="#2a3550" r={0.9} s={s} />
  </group>
);
const Stool = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.76, 0]} a={[0.2, 0.2, 0.06]} c="#1d1d20" s={s} />
    <Cyl p={[0, 0.38, 0]} a={[0.025, 0.025, 0.74]} c="#999" m={0.8} />
    <Cyl p={[0, 0.3, 0]} a={[0.16, 0.16, 0.02]} c="#999" m={0.8} />
    <Cyl p={[0, 0.01, 0]} a={[0.22, 0.22, 0.02]} c="#777" m={0.8} />
  </group>
);
const Spot = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.2, 0]} a={[0.02, 0.02, 0.4]} c="#333" />
    <Cyl p={[0, 0.5, 0]} rot={[-0.7, 0, 0]} a={[0.12, 0.16, 0.45]} c="#18181b" m={0.6} s={s} />
    <pointLight position={[0, 0.6, -0.3]} color="#fff1d6" intensity={3} distance={4} />
  </group>
);
const LedBar = ({ selected: s }: P) => (
  <Box p={[0, 0.05, 0]} a={[1, 0.08, 0.1]} c="#222" e="#7fd4ff" ei={s ? 0 : 0.8} s={s} />
);
const FloorLight = ({ selected: s }: P) => (
  <group>
    <Box p={[0, 0.08, 0]} a={[0.3, 0.16, 0.3]} c="#1a1a1d" s={s} />
    <Cyl p={[0, 0.2, 0.05]} rot={[-0.9, 0, 0]} a={[0.1, 0.12, 0.15]} c="#ffcf8a" />
    <pointLight position={[0, 0.4, 0]} color="#ffcf8a" intensity={2} distance={3} />
  </group>
);
const Sub = ({ selected: s }: P) => (
  <group>
    <Box p={[0, 0.3, 0]} a={[0.7, 0.6, 0.7]} c="#151517" r={0.85} s={s} />
    <Cyl p={[0, 0.3, 0.36]} rot={[Math.PI / 2, 0, 0]} a={[0.25, 0.25, 0.02]} c="#050505" />
  </group>
);
const Mic = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.01, 0]} a={[0.15, 0.15, 0.02]} c="#222" m={0.7} />
    <Cyl p={[0, 0.75, 0]} a={[0.012, 0.012, 1.5]} c="#555" m={0.8} />
    <mesh position={[0, 1.55, 0.03]} castShadow>
      <sphereGeometry args={[0.04, 16, 16]} />
      <M c="#777" m={0.8} s={s} />
    </mesh>
  </group>
);
const Stand = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.7, 0]} a={[0.03, 0.03, 1.4]} c="#444" m={0.8} s={s} />
    {[0, 2.1, 4.2].map((r) => (
      <Cyl key={r} p={[Math.sin(r) * 0.25, 0.05, Math.cos(r) * 0.25]} rot={[0.3, r, 1.2]} a={[0.015, 0.015, 0.6]} c="#444" m={0.8} s={s} />
    ))}
  </group>
);
const Screen = ({ w, h, y, s, hue }: { w: number; h: number; y: number; s?: boolean | undefined; hue: number }) => (
  <group>
    <Box p={[0, y, 0]} a={[w, h, 0.1]} c="#111114" s={s} />
    <mesh position={[0, y, 0.051]}>
      <planeGeometry args={[w - 0.1, h - 0.1]} />
      <meshBasicMaterial color={new THREE.Color(`hsl(${hue}, 55%, 35%)`)} toneMapped={false} />
    </mesh>
    <Cyl p={[0, (y - h / 2) / 2, 0]} a={[0.04, 0.04, Math.max(0.01, y - h / 2)]} c="#333" m={0.7} />
  </group>
);
const Plant = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.2, 0]} a={[0.2, 0.15, 0.4]} c="#6b4a33" s={s} />
    <mesh position={[0, 0.75, 0]} castShadow>
      <icosahedronGeometry args={[0.4, 1]} />
      <M c="#2f6b3a" r={0.9} s={s} />
    </mesh>
  </group>
);
const Vase = ({ selected: s }: P) => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow>
      <latheGeometry args={[[0.05, 0.2, 0.2, 0.08, 0.12].map((r, i) => new THREE.Vector2(r, i * 0.17)), 24]} />
      <M c="#c9b27a" m={0.6} r={0.3} s={s} />
    </mesh>
  </group>
);
const Guitar = ({ selected: s }: P) => (
  <group rotation={[0, 0, 0.15]}>
    <Box p={[0, 0.35, 0]} a={[0.36, 0.45, 0.1]} c="#a0522d" s={s} />
    <Box p={[0, 0.95, 0]} a={[0.06, 0.8, 0.04]} c="#3b2a20" s={s} />
  </group>
);
const Drum = ({ selected: s }: P) => (
  <group>
    <Cyl p={[0, 0.45, 0]} a={[0.3, 0.3, 0.4, 32]} c="#8b1e2d" s={s} />
    <Cyl p={[0, 0.66, 0]} a={[0.3, 0.3, 0.02, 32]} c="#eee" />
    {[0, 2.1, 4.2].map((r) => (
      <Cyl key={r} p={[Math.sin(r) * 0.25, 0.12, Math.cos(r) * 0.25]} a={[0.01, 0.01, 0.25]} c="#888" m={0.8} />
    ))}
  </group>
);

export function ExtraMesh({ type, selected, hue }: { type: string; selected?: boolean | undefined; hue: number }): ReactNode {
  switch (type) {
    case "steps": return <Steps selected={selected} />;
    case "backdrop": return <Backdrop selected={selected} />;
    case "truss": return <Truss selected={selected} />;
    case "table": return <Table selected={selected} />;
    case "sofa": return <Sofa selected={selected} />;
    case "stool": return <Stool selected={selected} />;
    case "spot": return <Spot selected={selected} />;
    case "ledbar": return <LedBar selected={selected} />;
    case "floorlight": return <FloorLight selected={selected} />;
    case "sub": return <Sub selected={selected} />;
    case "mic": return <Mic selected={selected} />;
    case "stand": return <Stand selected={selected} />;
    case "sideled": return <Screen w={2} h={1.2} y={1.6} s={selected} hue={hue} />;
    case "panel": return <Screen w={1.2} h={0.7} y={1.3} s={selected} hue={hue} />;
    case "plant": return <Plant selected={selected} />;
    case "vase": return <Vase selected={selected} />;
    case "guitar": return <Guitar selected={selected} />;
    case "drum": return <Drum selected={selected} />;
    default: return null;
  }
}
