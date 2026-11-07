"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { HowItWorksCubeFallback } from "@/Frontend/views/home/how-it-works-cube-fallback";

type RenderMode = "pending" | "static" | "webgl";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!context) return false;

    (context as unknown as WebGLRenderingContext)
      .getExtension("WEBGL_lose_context")
      ?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function makeGlowTexture() {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
      const alpha = Math.max(0, 1 - distance) ** 2.8;
      const offset = (y * size + x) * 4;
      pixels[offset] = 124;
      pixels[offset + 1] = 58;
      pixels[offset + 2] = 237;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(
    pixels,
    size,
    size,
    THREE.RGBAFormat,
  );
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function CubeModel() {
  const groupRef = useRef<THREE.Group>(null);
  const logoTexture = useTexture("/brand/mentra-icon.png");
  const geometries = useMemo(() => {
    const face = new THREE.BoxGeometry(2.6, 2.6, 2.6);
    const source = new THREE.BoxGeometry(2.6, 2.6, 2.6);
    const edges = new THREE.EdgesGeometry(source, 1);
    source.dispose();

    const positions = edges.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    const edgeColor = new THREE.Color("#C7D2FE");

    for (let index = 0; index < positions.count; index += 1) {
      colors[index * 3] = edgeColor.r;
      colors[index * 3 + 1] = edgeColor.g;
      colors[index * 3 + 2] = edgeColor.b;
    }

    edges.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return {
      face,
      edges,
      core: new THREE.SphereGeometry(0.12, 24, 24),
    };
  }, []);

  const glowTexture = useMemo(makeGlowTexture, []);
  const materials = useMemo(
    () => ({
      face: new THREE.MeshBasicMaterial({
        color: "#4F46E5",
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      edges: new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        toneMapped: false,
      }),
      core: new THREE.MeshStandardMaterial({
        color: "#A5B4FC",
        emissive: "#A5B4FC",
        emissiveIntensity: 0.16,
        roughness: 0.22,
        metalness: 0.05,
        toneMapped: false,
      }),
      glow: new THREE.SpriteMaterial({
        map: glowTexture,
        color: "#A5B4FC",
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
      logo: new THREE.SpriteMaterial({
        map: logoTexture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        depthTest: false,
      }),
    }),
    [glowTexture, logoTexture],
  );

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      glowTexture.dispose();
    },
    [geometries, glowTexture, materials],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group) {
      group.rotation.y += delta * 0.15;
      group.rotation.x = THREE.MathUtils.damp(
        group.rotation.x,
        0.56 + state.pointer.y * 0.07,
        3,
        delta,
      );
      group.rotation.z = THREE.MathUtils.damp(
        group.rotation.z,
        state.pointer.x * 0.06,
        3,
        delta,
      );
    }

    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.5;
    materials.glow.opacity = 0.24 + pulse * 0.07;
    materials.core.emissiveIntensity = 0.14 + pulse * 0.04;
  });

  return (
    <group ref={groupRef} rotation={[0.56, 0, 0]} dispose={null}>
      <mesh geometry={geometries.face} material={materials.face} />
      <lineSegments geometry={geometries.edges} material={materials.edges} />
      <sprite
        material={materials.glow}
        position={[0, 0, 0.12]}
        scale={[1.4, 1.4, 1]}
      />
      <mesh
        geometry={geometries.core}
        material={materials.core}
        position={[0, 0, 0.12]}
      />
      <sprite
        material={materials.logo}
        position={[0, 0.68, 0.28]}
        scale={[0.5, 0.5, 1]}
      />
    </group>
  );
}

class CubeErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("How it Works cube failed to render; using the SVG fallback.", error, info);
  }

  render() {
    if (this.state.failed) return <HowItWorksCubeFallback />;
    return this.props.children;
  }
}

export default function HowItWorksCube() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<RenderMode>("pending");
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    let webglAvailable: boolean | undefined;

    const updateMode = () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reducedMotion || window.innerWidth < 768) {
        setMode("static");
      } else {
        webglAvailable ??= supportsWebGL();
        setMode(webglAvailable ? "webgl" : "static");
      }
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", updateMode);
    window.addEventListener("resize", updateMode, { passive: true });
    updateMode();

    return () => {
      motionQuery.removeEventListener("change", updateMode);
      window.removeEventListener("resize", updateMode);
    };
  }, []);

  useEffect(() => {
    if (mode !== "webgl" || !hostRef.current) {
      setIsOnScreen(false);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsOnScreen(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsOnScreen(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [mode]);

  const showCanvas = mode === "webgl" && isOnScreen;

  return (
    <div
      ref={hostRef}
      className="relative mx-auto aspect-square w-full max-w-[460px] overflow-visible"
    >
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25)_0%,rgba(79,70,229,0.12)_42%,transparent_72%)] blur-2xl"
        aria-hidden="true"
      />
      {showCanvas ? (
        <CubeErrorBoundary>
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 8], fov: 35 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            className="!absolute inset-0"
          >
            <ambientLight intensity={0.35} />
            <CubeModel />
          </Canvas>
        </CubeErrorBoundary>
      ) : (
        <HowItWorksCubeFallback />
      )}
    </div>
  );
}
