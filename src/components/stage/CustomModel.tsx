import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLoader } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { signedModelUrl, useLibrary } from "@/lib/asset-library";

const TARGET = 1.6; // metres: largest side of a freshly imported model

/** Centre on X/Z, rest on the floor, and scale to a sensible size while keeping proportions. */
function normalize(src: THREE.Object3D): THREE.Object3D {
  const root = src.clone(true); // each instance gets its own copy; the file is downloaded once
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  const k = TARGET / max;
  root.scale.multiplyScalar(k);
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x * k, -box.min.y * k, -c.z * k);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const g = new THREE.Group();
  g.add(root);
  return g;
}

function Highlight({ obj, selected }: { obj: THREE.Object3D; selected: boolean }) {
  useEffect(() => {
    obj.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && "emissive" in m) {
        const mm = m as THREE.MeshStandardMaterial & { userData: { e?: THREE.Color; ei?: number } };
        if (!mm.userData.e) {
          mm.userData.e = mm.emissive.clone();
          mm.userData.ei = mm.emissiveIntensity;
        }
        mm.emissive.copy(selected ? new THREE.Color("#8b6cf0") : mm.userData.e);
        mm.emissiveIntensity = selected ? 0.35 : mm.userData.ei ?? 0;
      }
    });
  }, [obj, selected]);
  return null;
}

function cloneMaterials(o: THREE.Object3D) {
  o.traverse((n) => {
    const mesh = n as THREE.Mesh;
    if (mesh.isMesh) mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
  });
  return o;
}

function GltfModel({ url, selected }: { url: string; selected: boolean }) {
  const gltf = useLoader(GLTFLoader, url);
  const obj = useMemo(() => cloneMaterials(normalize(gltf.scene)), [gltf]);
  return (
    <>
      <primitive object={obj} />
      <Highlight obj={obj} selected={selected} />
    </>
  );
}
function ObjModel({ url, selected }: { url: string; selected: boolean }) {
  const src = useLoader(OBJLoader, url);
  const obj = useMemo(() => {
    const o = normalize(src);
    o.traverse((n) => {
      const mesh = n as THREE.Mesh;
      if (mesh.isMesh) mesh.material = new THREE.MeshStandardMaterial({ color: "#b8b4c8", roughness: 0.6 });
    });
    return o;
  }, [src]);
  return (
    <>
      <primitive object={obj} />
      <Highlight obj={obj} selected={selected} />
    </>
  );
}

function Placeholder({ label, error }: { label: string; error?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={error ? "#d4574e" : "#8b6cf0"} wireframe />
      </mesh>
      <Html position={[0, 1.25, 0]} center zIndexRange={[10, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-sm border border-border bg-background/90 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {label}
        </div>
      </Html>
    </group>
  );
}

class ModelBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  override render() {
    return this.state.failed ? <Placeholder label="Unable to load this 3D model." error /> : this.props.children;
  }
}

export function CustomModel({ assetId, selected }: { assetId: string | null | undefined; selected: boolean }) {
  const asset = useLibrary((s) => s.assets.find((a) => a.id === assetId));
  const loaded = useLibrary((s) => s.loaded);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!asset) return;
    let live = true;
    signedModelUrl(asset.storagePath).then(
      (u) => live && setUrl(u),
      () => live && setErr(true),
    );
    return () => {
      live = false;
    };
  }, [asset]);

  if (!assetId || (loaded && !asset)) return <Placeholder label="Asset removed from library" error />;
  if (err) return <Placeholder label="Unable to load this 3D model." error />;
  if (!asset || !url) return <Placeholder label="Loading model…" />;
  return (
    <ModelBoundary resetKey={url}>
      <Suspense fallback={<Placeholder label="Loading model…" />}>
        {asset.fileType === "obj" ? <ObjModel url={url} selected={selected} /> : <GltfModel url={url} selected={selected} />}
      </Suspense>
    </ModelBoundary>
  );
}
