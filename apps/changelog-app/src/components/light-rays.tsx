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
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
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
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true,
      });
      rendererRef.current = renderer;

      const gl = renderer.gl;
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      gl.canvas.style.position = "absolute";
      gl.canvas.style.top = "0";
      gl.canvas.style.left = "0";
      gl.canvas.style.mixBlendMode = "plus-lighter";
      gl.canvas.style.opacity = "1";

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

varying vec2 vUv;

// Enhanced noise functions for more organic variation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
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

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Use smoother interpolation for softer results
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * smoothNoise(p);
    p = p * 2.0 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

// New function for creating soft, varied ray patterns
float softRayPattern(vec2 coord, vec2 raySource, vec2 rayDir, float seed) {
  vec2 toCoord = coord - raySource;
  float distance = length(toCoord);
  
  // Create multiple scales of noise for variation
  float largeScale = fbm(coord * 0.002 + vec2(seed, -seed) + iTime * 0.1);
  float mediumScale = smoothNoise(coord * 0.008 + vec2(-seed * 2.0, seed) + iTime * 0.3);
  float smallScale = noise(coord * 0.02 + vec2(seed * 3.0, seed * 1.5) - iTime * 0.5);
  
  // Combine scales for organic variation
  float pattern = largeScale * 0.4 + mediumScale * 0.35 + smallScale * 0.25;
  
  // Add time-based evolution
  pattern *= 0.8 + 0.2 * sin(iTime * 0.7 + seed * 10.0 + distance * 0.001);
  
  return pattern;
}

// Enhanced ray strength with more randomization
float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed, float width) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  
  // Add varying noise to ray direction for more organic feel
  float angleNoise = fbm(coord * 0.003 + iTime * 0.15) - 0.5;
  float perturbedAngle = cosAngle + angleNoise * distortion * 0.15;
  
  // Softer angular falloff with variation
  float beamSharpness = mix(12.0, 2.5, clamp(lightSpread * width, 0.0, 1.0));
  float angularBase = max(perturbedAngle, 0.0);
  
  // Create both soft and sharp components
  float softFalloff = pow(angularBase, beamSharpness * 0.7);
  float sharpFalloff = pow(angularBase, beamSharpness * 2.0);
  float angularFalloff = mix(softFalloff, sharpFalloff, 0.3); // Blend soft and sharp

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  
  // Smoother distance falloff
  float lengthFalloff = smoothstep(maxDistance, 0.0, distance);
  float fadeFalloff = smoothstep(iResolution.x * fadeDistance, 0.0, distance);
  
  // Enhanced pulsation with variation
  float pulse = 1.0;
  if (pulsating > 0.5) {
    float pulseBase = sin(iTime * speed * 2.5 + seedA);
    float pulseNoise = noise(vec2(iTime * 0.3, seedB)) * 0.5 + 0.5;
    pulse = 0.85 + 0.15 * pulseBase * pulseNoise;
  }

  // More organic ray streaks with multiple frequencies
  vec2 perp = vec2(-rayRefDirection.y, rayRefDirection.x);
  float axis = dot(sourceToCoord, perp);
  
  // Multiple streak patterns at different scales
  float streak1 = sin(axis * 0.008 - iTime * 0.4 * speed + seedB);
  float streak2 = sin(axis * 0.02 - iTime * 0.6 * speed + seedA * 2.0);
  float streak3 = sin(axis * 0.035 + iTime * 0.3 * speed - seedB * 1.5);
  
  // Combine streaks with varying weights
  float streakPattern = abs(streak1) * 0.4 + abs(streak2) * 0.35 + abs(streak3) * 0.25;
  streakPattern = 1.0 - smoothstep(0.2, 0.8, streakPattern);
  
  // Add noise-based variation along the ray
  float rayNoise = softRayPattern(coord, raySource, rayRefDirection, seedA);
  streakPattern *= 0.6 + 0.4 * rayNoise;
  
  // Longitudinal variation with more complexity
  float long1 = sin(distance * 0.015 - iTime * 1.0 * speed + seedA);
  float long2 = sin(distance * 0.008 + iTime * 0.7 * speed + seedB * 2.0);
  float longitudinal = 0.85 + 0.15 * (long1 * 0.6 + long2 * 0.4);

  float baseStrength = angularFalloff * streakPattern * longitudinal;
  return baseStrength * lengthFalloff * fadeFalloff * pulse;
}

// Function for creating sharp highlights
float sharpHighlight(vec2 coord, vec2 raySource, vec2 rayDir, float seed) {
  vec2 toCoord = coord - raySource;
  float distance = length(toCoord);
  vec2 dirNorm = normalize(toCoord);
  float alignment = dot(dirNorm, rayDir);
  
  // Very sharp angular falloff for highlights
  float sharpness = pow(max(alignment, 0.0), 25.0);
  
  // Create bright spots along the ray
  float spots = sin(distance * 0.01 + seed * 10.0 + iTime * 2.0);
  spots = smoothstep(0.7, 1.0, spots);
  
  float highlight = sharpness * spots;
  highlight *= smoothstep(iResolution.x * 1.5, 0.0, distance);
  
  return highlight;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  // Multiple ray layers with different characteristics
  // Soft, wide rays for ambient glow
  vec4 softRay1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 
                                          36.2214, 21.11349, 0.8 * raysSpeed, 1.5);
  vec4 softRay2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 
                                          15.7832, 42.9187, 0.6 * raysSpeed, 1.8);
  
  // Medium rays for body
  vec4 mediumRay1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 
                                            22.3991, 18.0234, 1.2 * raysSpeed, 1.0);
  vec4 mediumRay2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 
                                            9.8765, 31.4159, 1.0 * raysSpeed, 0.8);
  
  // Narrow rays for detail
  vec4 narrowRay = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 
                                          7.2831, 26.5358, 1.5 * raysSpeed, 0.5);
  
  // Sharp highlights
  float highlight1 = sharpHighlight(coord, rayPos, finalRayDir, 12.345);
  float highlight2 = sharpHighlight(coord, rayPos, finalRayDir, 67.890);
  vec4 highlights = vec4(1.0) * (highlight1 * 0.6 + highlight2 * 0.4);

  // Combine all layers with different weights
  fragColor = softRay1 * 0.25 + softRay2 * 0.2 + 
              mediumRay1 * 0.35 + mediumRay2 * 0.3 + 
              narrowRay * 0.25 + highlights * 0.8;
  
  // Apply gaussian-like blur to the soft components
  vec3 col = fragColor.rgb;
  
  // Enhanced chromatic aberration for realism
  float chroma = 0.02 * (0.5 + 0.5 * sin(iTime * 0.5));
  float chromaNoise = fbm(coord * 0.003);
  col.r *= 1.0 + chroma * (chromaNoise - 0.5) * 1.2;
  col.g *= 1.0 + chroma * (fbm(coord * 0.003 + 27.1) - 0.5);
  col.b *= 1.0 + chroma * (fbm(coord * 0.003 + 54.3) - 0.5) * 0.8;
  
  // Add subtle color variation
  if (noiseAmount > 0.0) {
    float n = smoothNoise(coord * 0.008 + iTime * 0.05);
    col *= (1.0 - noiseAmount * 0.5 + noiseAmount * n);
  }
  
  // Atmospheric scattering effect
  float scatter = fbm(coord * 0.001 + iTime * 0.05) * 0.15;
  col += vec3(scatter * 0.3, scatter * 0.5, scatter * 0.7) * col;
  
  fragColor.rgb = clamp(col, 0.0, 1.0);

  // Natural brightness falloff
  float brightness = 1.0 - (coord.y / iResolution.y);
  brightness = brightness * brightness; // Quadratic falloff for more natural look
  fragColor.x = min(1.0, fragColor.x * (0.05 + brightness * 1.3));
  fragColor.y = min(1.0, fragColor.y * (0.15 + brightness * 1.1));
  fragColor.z = min(1.0, fragColor.z * (0.3 + brightness * 0.95));

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  // Screen blend with tint for natural light mixing
  fragColor.rgb = 1.0 - (1.0 - fragColor.rgb) * (1.0 - raysColor * 0.8);
  
  // Final contrast adjustment to maintain sharp highlights
  fragColor.rgb = pow(fragColor.rgb, vec3(0.95)); // Slight gamma correction
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
          renderer.render({ scene: mesh });
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
  ]);

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
