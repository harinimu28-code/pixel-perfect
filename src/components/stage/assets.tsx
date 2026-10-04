import { useMemo } from "react";
import * as THREE from "three";
import type { AssetType } from "@/lib/stage-store";

const SEL = new THREE.Color("#8b6cf0");

function Mat({
  color,
  selected,
  roughness = 0.6,
  metalness = 0.1,
  emissive,
  emissiveIntensity = 0,
  map,
}: {
  color: string;
  selected?: boolean;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: THREE.Texture;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      map={map}
      emissive={selected ? SEL : emissive ?? "#000000"}
      emissiveIntensity={selected ? 0.35 : emissiveIntensity}
    />
  );
}

function useScreenTexture(hue: number) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 512, 288);
    grd.addColorStop(0, `hsl(${hue},55%,22%)`);
    grd.addColorStop(1, `hsl(${hue + 40},60%,38%)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 288);
    g.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x < 512; x += 8) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 288);
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.font = "600 30px IBM Plex Sans, sans-serif";
    g.textAlign = "center";
    g.fillText("ANNUAL CULTURAL EVENT", 256, 135);
    g.font = "400 20px IBM Plex Mono, monospace";
    g.fillStyle = "rgba(255,255,255,0.6)";
    g.fillText("2026", 256, 170);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [hue]);
}

export function LedScreen({ selected, hue }: { selected?: boolean; hue: number }) {
  const tex = useScreenTexture(hue);
  return (
    <group>
      {[-2.9, 2.9].map((x) => (
        <mesh key={x} position={[x, 1.3, 0]} castShadow>
          <boxGeometry args={[0.12, 2.6, 0.12]} />
          <Mat color="#2a2a2e" metalness={0.6} roughness={0.4} selected={selected} />
        </mesh>
      ))}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[6, 3.4, 0.18]} />
        <Mat color="#111114" metalness={0.4} roughness={0.5} selected={selected} />
      </mesh>
      <mesh position={[0, 2.5, 0.095]}>
        <planeGeometry args={[5.8, 3.2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Podium({ selected }: { selected?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.1, 0.55]} />
        <Mat color="#3b2a20" roughness={0.5} selected={selected} />
      </mesh>
      <mesh position={[0, 1.15, 0.05]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.6]} />
        <Mat color="#4a3628" roughness={0.45} selected={selected} />
      </mesh>
      <mesh position={[0, 0.6, 0.28]}>
        <boxGeometry args={[0.5, 0.18, 0.01]} />
        <Mat color="#c9b27a" metalness={0.8} roughness={0.3} selected={selected} />
      </mesh>
      <mesh position={[0.15, 1.35, 0.1]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4]} />
        <Mat color="#222" metalness={0.8} />
      </mesh>
    </group>
  );
}

function Speaker({ selected }: { selected?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8]} />
        <Mat color="#333" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 3]} />
        <Mat color="#222" metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.5]} />
        <Mat color="#18181b" roughness={0.8} selected={selected} />
      </mesh>
      <mesh position={[0, 1.2, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 32]} />
        <Mat color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.75, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 24]} />
        <Mat color="#0a0a0a" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function StageLight({ selected, beam }: { selected?: boolean; beam: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.45, 0.16, 0.35]} />
        <Mat color="#1d1d20" metalness={0.5} selected={selected} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.42, 0.35, 0.05]} />
        <Mat color="#26262a" metalness={0.5} selected={selected} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[-0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.4, 24]} />
        <Mat color="#121214" metalness={0.6} selected={selected} />
      </mesh>
      {/* beam */}
      <mesh position={[0, 2.1, -1.0]} rotation={[-0.5 + Math.PI, 0, 0]}>
        <coneGeometry args={[0.7, 3.6, 24, 1, true]} />
        <meshBasicMaterial
          color={beam}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 0.7, -0.3]} color={beam} intensity={4} distance={5} />
    </group>
  );
}

function Chair({ selected }: { selected?: boolean }) {
  const legs: [number, number][] = [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ];
  return (
    <group>
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.22, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.44]} />
          <Mat color="#8a8a90" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.48, 0.06, 0.48]} />
        <Mat color="#5a2430" roughness={0.8} selected={selected} />
      </mesh>
      <mesh position={[0, 0.78, -0.22]} castShadow>
        <boxGeometry args={[0.48, 0.56, 0.05]} />
        <Mat color="#5a2430" roughness={0.8} selected={selected} />
      </mesh>
    </group>
  );
}

function Prop({ selected }: { selected?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.6]} />
        <Mat color="#d8d2c4" roughness={0.7} selected={selected} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 1.8, 20]} />
        <Mat color="#e4ded0" roughness={0.6} selected={selected} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.16, 0.3, 20]} />
        <Mat color="#b08a3e" metalness={0.7} roughness={0.35} selected={selected} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <Mat color="#3f6b45" roughness={0.9} selected={selected} />
      </mesh>
    </group>
  );
}

function Riser({ selected }: { selected?: boolean }) {
  return (
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 0.4, 1.5]} />
      <Mat color="#26262b" roughness={0.7} selected={selected} />
    </mesh>
  );
}

export function AssetMesh({
  type,
  selected,
  beam,
  hue,
}: {
  type: AssetType;
  selected?: boolean;
  beam: string;
  hue: number;
}) {
  switch (type) {
    case "led":
      return <LedScreen selected={selected} hue={hue} />;
    case "podium":
      return <Podium selected={selected} />;
    case "speaker":
      return <Speaker selected={selected} />;
    case "light":
      return <StageLight selected={selected} beam={beam} />;
    case "chair":
      return <Chair selected={selected} />;
    case "prop":
      return <Prop selected={selected} />;
    case "stage":
      return <Riser selected={selected} />;
  }
}
