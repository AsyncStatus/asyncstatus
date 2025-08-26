import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, useState } from "react";

export type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "right"
  | "left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  intensity?: number;
  blendMode?: string;
  canvasOpacity?: number;
  anisotropy?: number;
  attenuation?: number;
  ditherAmount?: number;
  // performance controls
  minDpr?: number;
  maxDpr?: number;
  autoPerformance?: boolean;
  targetFps?: number;
  dprStep?: number;
  className?: string;
}

const DEFAULT_COLOR = "#BFDBFE"; // Tailwind blue-200, fits blueprint background

const hexToRgb = (hex: string): [number, number, number] => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [1, 1, 1];
  const [, r, g, b] = match;
  if (!r || !g || !b) return [1, 1, 1];
  return [Number.parseInt(r, 16) / 255, Number.parseInt(g, 16) / 255, Number.parseInt(b, 16) / 255];
};

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface Uniform<T> {
  value: T;
}

interface LightRaysUniforms {
  iTime: Uniform<number>;
  iResolution: Uniform<Vec2>;
  rayPos: Uniform<Vec2>;
  rayDir: Uniform<Vec2>;
  raysColor: Uniform<Vec3>;
  raysSpeed: Uniform<number>;
  lightSpread: Uniform<number>;
  rayLength: Uniform<number>;
  pulsating: Uniform<number>;
  fadeDistance: Uniform<number>;
  saturation: Uniform<number>;
  mousePos: Uniform<Vec2>;
  mouseInfluence: Uniform<number>;
  noiseAmount: Uniform<number>;
  distortion: Uniform<number>;
  intensity: Uniform<number>;
  anisotropy: Uniform<number>;
  attenuation: Uniform<number>;
  ditherAmount: Uniform<number>;
}

const getAnchorAndDir = (
  origin: RaysOrigin,
  w: number,
  h: number,
): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case "top-right":
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: // "top-center"
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = "top-center",
  raysColor = DEFAULT_COLOR,
  raysSpeed = 0.5,
  lightSpread = 1,
  rayLength = 0.9,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 0.85,
  followMouse = true,
  mouseInfluence = 0.02,
  noiseAmount = 0.0,
  distortion = 0.02,
  intensity = 0.18,
  blendMode = "plus-lighter",
  canvasOpacity = 0.35,
  anisotropy = 0.6,
  attenuation = 0.8,
  ditherAmount = 0.002,
  // performance controls
  minDpr = 1,
  maxDpr = 1.5,
  autoPerformance = true,
  targetFps = 55,
  dprStep = 0.1,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<LightRaysUniforms | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef = useRef<number | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const cleanupFunctionRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current();
      cleanupFunctionRef.current = null;
    }

    const initializeWebGL = async () => {
      if (!containerRef.current) return;

      await new Promise((resolve) => setTimeout(resolve, 10));

      if (!containerRef.current) return;

      const renderer = new Renderer({
        dpr: Math.max(minDpr, Math.min(window.devicePixelRatio, maxDpr)),
        alpha: true,
      });
      rendererRef.current = renderer;

      const gl = renderer.gl;
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.position = "absolute";
      gl.canvas.style.top = "0";
      gl.canvas.style.left = "0";
      gl.canvas.style.mixBlendMode = blendMode;
      gl.canvas.style.opacity = `${canvasOpacity}`;

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(gl.canvas);

      const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

      const frag = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
uniform float intensity;
uniform float anisotropy;
uniform float attenuation;
uniform float ditherAmount;

varying vec2 vUv;

// Unique noise stack: value noise + fbm
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.0 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  // Angular scattering using HG-like phase + soft falloff
  float smallNoise = distortion * (noise(coord * 0.02 + iTime * 0.2) - 0.5) * 0.03;
  float g = clamp(anisotropy, -0.95, 0.95);
  float denom = 1.0 + g * g - 2.0 * g * cosAngle;
  float hg = (1.0 - g * g) / max(1e-3, pow(denom, 1.5));
  float beamSharpness = mix(18.0, 3.0, clamp(lightSpread, 0.0, 1.0));
  float lambert = pow(max(cosAngle + smallNoise, 0.0), beamSharpness);
  float angularFalloff = mix(lambert, clamp(hg, 0.0, 3.0), 0.6);

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float extinction = exp(-distance / max(1e-3, (iResolution.x * attenuation)));
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.95 + 0.05 * sin(iTime * speed * 2.0 + seedA)) : 1.0;

  // Perpendicular noise-driven streaks for volumetric shafts
  vec2 perp = vec2(-rayRefDirection.y, rayRefDirection.x);
  float axis = dot(sourceToCoord, perp);
  float streakNoise = fbm(vec2(axis * 0.01, distance * 0.004) + vec2(seedA, seedB) + iTime * 0.03 * speed);
  float stripe = smoothstep(0.55, 1.0, streakNoise);
  float longitudinal = 0.98 + 0.02 * sin(distance * 0.015 - iTime * 0.8 * speed + seedA);

  float baseStrength = angularFalloff * stripe * longitudinal;
  return baseStrength * lengthFalloff * fadeFalloff * pulse * extinction;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                                      1.3 * raysSpeed);
  fragColor = rays;

  // Subtle chromatic variance for uniqueness (reduced to keep it ray-like)
  vec3 col = fragColor.rgb;
  float chroma = 0.003 * (0.5 + 0.5 * sin(iTime * 0.7));
  float n = fbm(coord * 0.004 + 21.7);
  col *= 1.0 + chroma * ((n - 0.5) * vec3(1.03, 1.00, 0.97));
  fragColor.rgb = clamp(col, 0.0, 1.0);

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x = min(1.0, fragColor.x * (0.1 + brightness * 0.6));
  fragColor.y = min(1.0, fragColor.y * (0.2 + brightness * 0.5));
  fragColor.z = min(1.0, fragColor.z * (0.3 + brightness * 0.45));

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  // Tint the light color (shader outputs intensity; canvas uses additive blend)
  fragColor.rgb *= raysColor;
  fragColor.rgb *= intensity;

  // Subtle dithering to reduce banding
  if (ditherAmount > 0.0) {
    float d = (hash(fragCoord * 0.5 + iTime * 7.31) - 0.5) * 2.0 * ditherAmount;
    fragColor.rgb = clamp(fragColor.rgb + d, 0.0, 1.0);
  }
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`;

      const uniforms: LightRaysUniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },

        rayPos: { value: [0, 0] },
        rayDir: { value: [0, 1] },

        raysColor: { value: hexToRgb(raysColor) },
        raysSpeed: { value: raysSpeed },
        lightSpread: { value: lightSpread },
        rayLength: { value: rayLength },
        pulsating: { value: pulsating ? 1.0 : 0.0 },
        fadeDistance: { value: fadeDistance },
        saturation: { value: saturation },
        mousePos: { value: [0.5, 0.5] },
        mouseInfluence: { value: mouseInfluence },
        noiseAmount: { value: noiseAmount },
        distortion: { value: distortion },
        intensity: { value: intensity },
        anisotropy: { value: anisotropy },
        attenuation: { value: attenuation },
        ditherAmount: { value: ditherAmount },
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms,
      });
      const mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      const updatePlacement = () => {
        if (!containerRef.current || !renderer) return;

        renderer.dpr = Math.min(window.devicePixelRatio, 2);

        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
        renderer.setSize(wCSS, hCSS);

        const dpr = renderer.dpr;
        const w = wCSS * dpr;
        const h = hCSS * dpr;

        uniforms.iResolution.value = [w, h];

        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
        uniforms.rayPos.value = anchor;
        uniforms.rayDir.value = dir;
      };

      const loop = (t: number) => {
        if (!rendererRef.current || !uniformsRef.current || !meshRef.current) {
          return;
        }

        uniforms.iTime.value = t * 0.001;

        if (followMouse && mouseInfluence > 0.0) {
          const smoothing = 0.92;

          smoothMouseRef.current.x =
            smoothMouseRef.current.x * smoothing + mouseRef.current.x * (1 - smoothing);
          smoothMouseRef.current.y =
            smoothMouseRef.current.y * smoothing + mouseRef.current.y * (1 - smoothing);

          uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
        }

        try {
          const frameStart = performance.now();
          renderer.render({ scene: mesh });
          const frameTime = performance.now() - frameStart;
          if (autoPerformance) {
            const fps = 1000 / Math.max(frameTime, 0.0001);
            const desired = targetFps;
            const delta = fps - desired;
            if (Math.abs(delta) > 5) {
              const newDpr = Math.max(
                minDpr,
                Math.min(renderer.dpr + (delta < 0 ? -dprStep : dprStep), maxDpr),
              );
              if (Math.abs(newDpr - renderer.dpr) > 0.01 && containerRef.current) {
                renderer.dpr = newDpr;
                const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
                renderer.setSize(wCSS, hCSS);
                const w = wCSS * newDpr;
                const h = hCSS * newDpr;
                uniforms.iResolution.value = [w, h];
              }
            }
          }
          animationIdRef.current = requestAnimationFrame(loop);
        } catch (error) {
          console.warn("WebGL rendering error:", error);
          return;
        }
      };

      window.addEventListener("resize", updatePlacement);
      updatePlacement();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupFunctionRef.current = () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }

        window.removeEventListener("resize", updatePlacement);

        if (renderer) {
          try {
            const canvas = renderer.gl.canvas;
            const loseContextExt = renderer.gl.getExtension("WEBGL_lose_context");
            loseContextExt?.loseContext();
            canvas?.parentNode?.removeChild(canvas);
          } catch (error) {
            console.warn("Error during WebGL cleanup:", error);
          }
        }

        rendererRef.current = null;
        uniformsRef.current = null;
        meshRef.current = null;
      };
    };

    initializeWebGL();

    return () => {
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
    };
  }, [
    isVisible,
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  useEffect(() => {
    if (!uniformsRef.current || !containerRef.current || !rendererRef.current) return;

    const u = uniformsRef.current;
    const renderer = rendererRef.current;

    u.raysColor.value = hexToRgb(raysColor);
    u.raysSpeed.value = raysSpeed;
    u.lightSpread.value = lightSpread;
    u.rayLength.value = rayLength;
    u.pulsating.value = pulsating ? 1.0 : 0.0;
    u.fadeDistance.value = fadeDistance;
    u.saturation.value = saturation;
    u.mouseInfluence.value = mouseInfluence;
    u.noiseAmount.value = noiseAmount;
    u.distortion.value = distortion;
    u.intensity.value = intensity;
    u.anisotropy.value = anisotropy;
    u.attenuation.value = attenuation;
    u.ditherAmount.value = ditherAmount;

    const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
    const dpr = renderer.dpr;
    const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr);
    u.rayPos.value = anchor;
    u.rayDir.value = dir;
  }, [
    raysColor,
    raysSpeed,
    lightSpread,
    raysOrigin,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
    intensity,
    anisotropy,
    attenuation,
    ditherAmount,
  ]);

  useEffect(() => {
    if (!rendererRef.current) return;
    const canvas = rendererRef.current.gl.canvas as HTMLCanvasElement | undefined;
    if (!canvas) return;
    canvas.style.mixBlendMode = blendMode;
    canvas.style.opacity = `${canvasOpacity}`;
  }, [blendMode, canvasOpacity]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !rendererRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x, y };
    };

    if (followMouse) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [followMouse]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full pointer-events-none z-[3] overflow-hidden relative ${className}`.trim()}
    />
  );
};

export default LightRays;
