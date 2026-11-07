"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";

type FallbackReason = "reduced motion" | "width under 768px" | "no WebGL" | "error";

/** Bright cream at the heart of the column; blends out to --accent and --glow. */
const CORE_COLOR = "#F5E6D3";
/** The fixed nav is 64px tall; the column starts right underneath it. */
const NAV_HEIGHT_PX = 64;
/** Width of the bright core of the column. */
const COLUMN_CORE_PX = 170;
/** Full width of the column plane, including the soft glow falloff either side of the core. */
const COLUMN_PLANE_PX = 480;
const HORIZON_WIDTH_PX = 1100;
const HORIZON_HEIGHT_PX = 260;
const PARTICLE_COUNT = 26;
/** Camera sits at z=7 and the column plane at z=-0.3, so the visible plane is 7.3 units away. */
const CAMERA_FOV = 42;
const PLANE_DISTANCE = 7.3;

const planeVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Thin vertical column: a hot cream centre line, a saffron core body about
// COLUMN_CORE_PX wide, and a soft --glow falloff out to the plane edges.
// Brightest at the top of the hero, fading out toward the bottom.
const columnFragmentShader = `
  uniform vec3 uCoreColor;
  uniform vec3 uAccentColor;
  uniform vec3 uGlowColor;
  uniform float uCoreRatio;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float d = abs(vUv.x - 0.5) * 2.0;
    float x = d / uCoreRatio;
    float hot = exp(-x * x * 9.0);
    float body = exp(-x * x * 1.6);
    float halo = exp(-d * d * 4.0) * (1.0 - smoothstep(0.7, 1.0, d));

    float topCap = 1.0 - smoothstep(0.97, 1.0, vUv.y);
    float vertical = topCap * smoothstep(0.0, 0.92, vUv.y);
    float flicker = 0.97 + 0.03 * sin(uTime * 0.9 + vUv.y * 6.0);

    vec3 color = mix(uGlowColor, uAccentColor, smoothstep(0.05, 0.6, body));
    color = mix(color, uCoreColor, hot);
    float intensity = (halo * 0.2 + body * 0.42 + hot * 0.4) * vertical * flicker;
    gl_FragColor = vec4(color, min(intensity, 0.85));
  }
`;

// Soft horizon glow along the bottom of the hero where the column lands.
// It fades out just before the bottom edge so there is no seam with the next section.
const horizonFragmentShader = `
  uniform vec3 uGlowColor;
  uniform vec3 uAccentColor;
  varying vec2 vUv;
  void main() {
    vec2 p = vec2((vUv.x - 0.5) * 2.0, (vUv.y - 0.32) * 1.5);
    float wide = pow(1.0 - smoothstep(0.0, 1.0, length(p)), 2.0);
    float spot = pow(1.0 - smoothstep(0.0, 1.0, length(vec2(p.x * 3.4, p.y * 1.4))), 2.0);
    float edgeFade = smoothstep(0.0, 0.3, vUv.y);
    vec3 color = mix(uGlowColor, uAccentColor, spot * 0.5);
    gl_FragColor = vec4(color, (wide * 0.15 + spot * 0.1) * edgeFade);
  }
`;

const particleVertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aTint;
  varying float vBrightness;
  varying float vTint;
  uniform float uPixelRatio;
  uniform float uTop;
  uniform float uBottom;
  void main() {
    float span = uTop - uBottom;
    float t = clamp((position.y - uBottom) / span, 0.0, 1.0);
    float fade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));
    vBrightness = aBrightness * fade;
    vTint = aTint;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform vec3 uCoreColor;
  uniform vec3 uAccentColor;
  varying float vBrightness;
  varying float vTint;
  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = (1.0 - smoothstep(0.3, 0.5, distanceFromCenter)) * vBrightness;
    vec3 color = mix(uCoreColor, uAccentColor, vTint);
    gl_FragColor = vec4(color, alpha);
  }
`;

type Palette = { core: THREE.Color; accent: THREE.Color; glow: THREE.Color };

type HeroLayout = {
  /** World units per CSS pixel at the column plane. */
  pixelsToWorld: number;
  viewHeight: number;
  /** World-space y of the column top (just under the nav) and of the hero bottom. */
  columnTop: number;
  columnBottom: number;
};

function useHeroLayout(): HeroLayout {
  const { size } = useThree();
  const viewHeight = 2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * PLANE_DISTANCE;
  const pixelsToWorld = size.height > 0 ? viewHeight / size.height : 0;
  return {
    pixelsToWorld,
    viewHeight,
    columnTop: viewHeight / 2 - NAV_HEIGHT_PX * pixelsToWorld,
    columnBottom: -viewHeight / 2,
  };
}

function usePalette(): Palette {
  return useMemo(() => {
    const homeRoot = document.querySelector(".mentra-home")!;
    const homeStyle = getComputedStyle(homeRoot);
    return {
      core: new THREE.Color(CORE_COLOR),
      accent: new THREE.Color(homeStyle.getPropertyValue("--accent").trim()),
      glow: new THREE.Color(homeStyle.getPropertyValue("--glow").trim()),
    };
  }, []);
}

/** Gaussian-ish random in roughly [-1, 1], so particles cluster at the column's centre. */
function centredRandom() {
  return (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
}

function Particles({ palette, layout }: { palette: Palette; layout: HeroLayout }) {
  const { gl } = useThree();
  const { columnTop, columnBottom, pixelsToWorld } = layout;
  const speeds = useMemo(() => {
    const values = new Float32Array(PARTICLE_COUNT);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      // Roughly 6 to 14 CSS pixels per second at a typical hero height.
      values[index] = 0.035 + Math.random() * 0.05;
    }
    return values;
  }, []);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const brightness = new Float32Array(PARTICLE_COUNT);
    const tints = new Float32Array(PARTICLE_COUNT);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions[index * 3] = centredRandom();
      positions[index * 3 + 1] = Math.random();
      positions[index * 3 + 2] = (Math.random() - 0.5) * 0.6;
      sizes[index] = 1.2 + Math.random() * 1.2;
      brightness[index] = 0.45 + Math.random() * 0.4;
      tints[index] = Math.random();
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    nextGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    nextGeometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    return nextGeometry;
  }, []);

  // Spread the particles through the column once its size in world units is known.
  // Stored x is in [-1, 1] and y in [0, 1] until then, so rescale them here.
  const placedFor = useRef<string | null>(null);
  useEffect(() => {
    const key = `${columnTop}:${columnBottom}:${pixelsToWorld}`;
    if (pixelsToWorld === 0 || placedFor.current === key) return;
    const halfWidth = (COLUMN_CORE_PX / 2) * pixelsToWorld;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions.setX(index, centredRandom() * halfWidth);
      positions.setY(index, columnBottom + Math.random() * (columnTop - columnBottom));
    }
    positions.needsUpdate = true;
    placedFor.current = key;
  }, [columnBottom, columnTop, geometry, pixelsToWorld]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uPixelRatio: { value: 1 },
          uTop: { value: 1 },
          uBottom: { value: -1 },
          uCoreColor: { value: palette.core },
          uAccentColor: { value: palette.accent },
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [palette],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (placedFor.current === null) return;
    const step = Math.min(delta, 0.1);
    const span = columnTop - columnBottom;
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      let y = positions.getY(index) + speeds[index] * step;
      if (y > columnTop) y -= span;
      positions.setY(index, y);
    }
    positions.needsUpdate = true;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uTop.value = columnTop;
    material.uniforms.uBottom.value = columnBottom;
  });

  return <points geometry={geometry} material={material} />;
}

function LightColumn({ palette, layout }: { palette: Palette; layout: HeroLayout }) {
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const columnMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCoreRatio: { value: COLUMN_CORE_PX / COLUMN_PLANE_PX },
          uCoreColor: { value: palette.core },
          uAccentColor: { value: palette.accent },
          uGlowColor: { value: palette.glow },
        },
        vertexShader: planeVertexShader,
        fragmentShader: columnFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [palette],
  );
  const horizonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uGlowColor: { value: palette.glow },
          uAccentColor: { value: palette.accent },
        },
        vertexShader: planeVertexShader,
        fragmentShader: horizonFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [palette],
  );

  useEffect(() => () => {
    planeGeometry.dispose();
    columnMaterial.dispose();
    horizonMaterial.dispose();
  }, [columnMaterial, horizonMaterial, planeGeometry]);

  useFrame(({ clock }) => {
    columnMaterial.uniforms.uTime.value = clock.getElapsedTime();
  });

  const { pixelsToWorld, columnTop, columnBottom } = layout;
  const columnHeight = columnTop - columnBottom;
  const columnWidth = COLUMN_PLANE_PX * pixelsToWorld;
  const horizonWidth = HORIZON_WIDTH_PX * pixelsToWorld;
  const horizonHeight = HORIZON_HEIGHT_PX * pixelsToWorld;

  return (
    <>
      <mesh
        geometry={planeGeometry}
        position={[0, columnBottom + columnHeight / 2, -0.3]}
        scale={[columnWidth, columnHeight, 1]}
      >
        <primitive object={columnMaterial} attach="material" />
      </mesh>
      <mesh
        geometry={planeGeometry}
        position={[0, columnBottom + horizonHeight / 2, -0.3]}
        scale={[horizonWidth, horizonHeight, 1]}
      >
        <primitive object={horizonMaterial} attach="material" />
      </mesh>
    </>
  );
}

function Scene({
  paused,
  parallax,
  onRendered,
}: {
  paused: boolean;
  parallax: { x: number; y: number };
  onRendered: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const reportedRender = useRef(false);
  const { invalidate } = useThree();
  const palette = usePalette();
  const layout = useHeroLayout();

  useEffect(() => {
    if (paused) return;
    let frame = 0;
    const tick = () => {
      invalidate();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [invalidate, paused]);

  useFrame(({ clock, gl }) => {
    if (!groupRef.current) return;
    if (!reportedRender.current && gl.info.render.calls > 0) {
      reportedRender.current = true;
      onRendered();
    }
    // Small sideways sway only; the column stays anchored under the nav.
    groupRef.current.position.x = parallax.x * 0.12 + Math.sin(clock.getElapsedTime() * 0.25) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <LightColumn palette={palette} layout={layout} />
      <Particles palette={palette} layout={layout} />
    </group>
  );
}

function CanvasContextGuard({ onError }: { onError: (error: Error) => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onError(new Error("WebGL context lost"));
    };
    gl.domElement.addEventListener("webglcontextlost", handleContextLost);
    if (gl.getContext().isContextLost()) onError(new Error("WebGL context is unavailable"));
    return () => gl.domElement.removeEventListener("webglcontextlost", handleContextLost);
  }, [gl, onError]);

  return null;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function WebGLHero({
  paused,
  parallax,
  onRendered,
  onError,
}: {
  paused: boolean;
  parallax: { x: number; y: number };
  onRendered: () => void;
  onError: (error: Error) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <CanvasErrorBoundary onError={onError}>
        <Canvas
          camera={{ position: [0, 0, 7], fov: CAMERA_FOV }}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            try {
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            } catch (error) {
              onError(error instanceof Error ? error : new Error(String(error)));
            }
          }}
        >
          <CanvasContextGuard onError={onError} />
          <Scene paused={paused} parallax={parallax} onRendered={onRendered} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

/** Same column, horizon glow and particles in plain CSS, for reduced motion, small screens and no WebGL. */
function CssFallback({ mobile }: { mobile: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes hero-fallback-drift {
          from { transform: translate3d(0, 10px, 0); opacity: .45; }
          to { transform: translate3d(-2px, -28px, 0); opacity: .85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-fallback-particle { animation: none !important; }
        }
      `}</style>
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: HORIZON_HEIGHT_PX,
          background:
            "radial-gradient(50% 90% at 50% 70%, color-mix(in srgb, var(--glow) 18%, transparent) 0%, color-mix(in srgb, var(--glow) 7%, transparent) 50%, transparent 80%)",
          maskImage: "linear-gradient(to top, transparent 0%, black 30%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 max-w-full -translate-x-1/2 blur-[6px]"
        style={{
          top: NAV_HEIGHT_PX,
          width: COLUMN_PLANE_PX,
          // On phones the column runs straight behind the copy, so keep it faint enough to read through.
          opacity: mobile ? 0.45 : 1,
          background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--glow) 6%, transparent) 22%, color-mix(in srgb, var(--accent) 22%, transparent) 33%, color-mix(in srgb, var(--accent) 42%, transparent) 42%, color-mix(in srgb, ${CORE_COLOR} 66%, transparent) 48.5%, color-mix(in srgb, ${CORE_COLOR} 66%, transparent) 51.5%, color-mix(in srgb, var(--accent) 42%, transparent) 58%, color-mix(in srgb, var(--accent) 22%, transparent) 67%, color-mix(in srgb, var(--glow) 6%, transparent) 78%, transparent 100%)`,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 25%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 25%, transparent 92%)",
        }}
      />
      {Array.from({ length: mobile ? 8 : 14 }, (_, index) => (
        <span
          key={index}
          className="hero-fallback-particle absolute rounded-full"
          style={{
            left: `calc(50% + ${((index * 37) % 140) - 70}px)`,
            top: `${12 + ((index * 31) % 76)}%`,
            width: "2px",
            height: "2px",
            backgroundColor: index % 3 === 0 ? CORE_COLOR : "var(--accent)",
            animation: `hero-fallback-drift ${20 + (index % 9)}s linear ${index * -1.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [fallback, setFallback] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [canvasRendering, setCanvasRendering] = useState(false);
  const currentFallbackReason = useRef<FallbackReason | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const paused = offscreen || tabHidden;

  const reportCanvasError = useCallback((error: Error) => {
    console.error("Hero background Canvas error:", error);
    currentFallbackReason.current = "error";
    setCanvasRendering(false);
    setFallback(true);
  }, []);

  const reportCanvasRender = useCallback(() => {
    if (currentFallbackReason.current) return;
    setCanvasRendering(true);
    setFallback(false);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(max-width: 767px)");
    const canvas = document.createElement("canvas");
    let webglAvailable = false;
    try {
      webglAvailable = Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      webglAvailable = false;
    }
    const updateMode = () => {
      setMobile(smallScreen.matches);
      const reason: FallbackReason | null = reducedMotion.matches
        ? "reduced motion"
        : smallScreen.matches
          ? "width under 768px"
          : !webglAvailable
            ? "no WebGL"
            : null;
      currentFallbackReason.current = reason;
      setCanvasRendering(false);
      setFallback(reason !== null);
    };
    updateMode();
    reducedMotion.addEventListener("change", updateMode);
    smallScreen.addEventListener("change", updateMode);

    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0.01 },
    );
    if (rootRef.current) observer.observe(rootRef.current);
    const onVisibilityChange = () => setTabHidden(document.hidden);
    const onMouseMove = (event: MouseEvent) => {
      setParallax({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * -2,
      });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", updateMode);
      smallScreen.removeEventListener("change", updateMode);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {fallback || !canvasRendering ? <CssFallback mobile={mobile} /> : null}
      {!fallback ? (
        <WebGLHero
          paused={paused}
          parallax={parallax}
          onRendered={reportCanvasRender}
          onError={reportCanvasError}
        />
      ) : null}
    </div>
  );
}
