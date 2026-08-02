"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Wider, blurrier WebGL light rays with length + shape that vary over time.
 * Shader design mirrors the production ExamHub `LightRays` effect so the look
 * stays consistent across both apps.
 */
type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "top-center-offset"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

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

// Convert "#rrggbb" to a normalized RGB triplet. Falls back to white.
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [1, 1, 1];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}

// Map an `raysOrigin` name to {anchor, dir} in pixels. Mirrors the upstream
// helper that produces smooth, off-screen anchor points so rays radiate in
// from beyond the viewport edge instead of starting inside the frame.
function getAnchor(
  origin: RaysOrigin,
  width: number,
  height: number
): { anchor: [number, number]; dir: [number, number] } {
  switch (origin) {
    case "top-left":
      return { anchor: [0, -0.2 * height], dir: [0, 1] };
    case "top-right":
      return { anchor: [width, -0.2 * height], dir: [0, 1] };
    case "top-center-offset":
      return {
        anchor: [0.5 * width + 0.2 * width, -0.2 * height],
        dir: [-0.2, 1],
      };
    case "left":
      return { anchor: [-0.2 * width, 0.5 * height], dir: [1, 0] };
    case "right":
      return { anchor: [1.2 * width, 0.5 * height], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, 1.2 * height], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * width, 1.2 * height], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [width, 1.2 * height], dir: [0, -1] };
    case "top-center":
    default:
      return { anchor: [0.5 * width, -0.2 * height], dir: [0, 1] };
  }
}

const VERTEX_SHADER = /* glsl */ `
  // Three.js auto-injects \`position\` (vec3) plus skin/skinIndex/skinWeight
  // attributes when the geometry has them. We only use \`position.xy\` for a
  // fullscreen quad, so re-declaring it as vec2 collides with the injected
  // vec3 attribute. Instead, derive a 2D position from the injected \`uv\`
  // attribute and pass it through directly.
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Fragment shader: two overlapping ray fields with different seeds & speeds,
// each modulated by a time-varying distortion, length falloff, and per-ray
// base-strength oscillation. Result is softened by a vertical brightness
// curve so the rays bloom into the background rather than cutting hard.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

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

  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float rayStrength(
    vec2 raySource,
    vec2 rayRefDirection,
    vec2 coord,
    float seedA,
    float seedB,
    float speed
  ) {
    vec2 sourceToCoord = coord - raySource;
    vec2 dirNorm = normalize(sourceToCoord);
    float cosAngle = dot(dirNorm, rayRefDirection);

    // Angle wiggles over time so the apparent shape of each ray slowly drifts.
    float distortedAngle = cosAngle +
      distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;

    float spreadFactor = pow(
      max(distortedAngle, 0.0),
      1.0 / max(lightSpread, 0.001)
    );

    float distance = length(sourceToCoord);
    float maxDistance = iResolution.x * rayLength;
    float lengthFalloff = clamp(
      (maxDistance - distance) / maxDistance,
      0.0,
      1.0
    );

    // Soft fade so rays dissolve into the canvas instead of ending sharply.
    float fadeFalloff = clamp(
      (iResolution.x * fadeDistance - distance) /
        (iResolution.x * fadeDistance),
      0.5,
      1.0
    );

    float pulse = pulsating > 0.5
      ? (0.8 + 0.2 * sin(iTime * speed * 3.0))
      : 1.0;

    float baseStrength = clamp(
      (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
      (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
      0.0,
      1.0
    );

    return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);

    vec2 finalRayDir = rayDir;
    if (mouseInfluence > 0.0) {
      vec2 mouseScreenPos = mousePos * iResolution.xy;
      vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
      finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
    }

    vec4 rays1 = vec4(1.0) *
      rayStrength(rayPos, finalRayDir, coord,
                  36.2214, 21.11349, 1.5 * raysSpeed);
    vec4 rays2 = vec4(1.0) *
      rayStrength(rayPos, finalRayDir, coord,
                  22.3991, 18.0234, 1.1 * raysSpeed);

    // Boost the per-ray intensity so rays remain clearly visible against
    // both light and dark page washes. Additive blending compounds this
    // naturally where rays overlap. Kept moderate so rays don't blanket
    // the whole page — they should feel like a focused beam at the top.
    fragColor = rays1 * 0.75 + rays2 * 0.7;

    if (noiseAmount > 0.0) {
      float n = noise(coord * 0.01 + iTime * 0.1);
      fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
    }

    // Brightness ramps up toward the source so rays feel atmospheric, not
    // laser-cut. Smoothstep curve eases both ends so the beam fades into
    // transparency above and below — no hard edge where rays stop.
    // Multipliers kept low so the beam is a soft accent, not a glow.
    float t = clamp(coord.y / iResolution.y, 0.0, 1.0);
    float brightness = smoothstep(0.0, 0.55, 1.0 - t) * smoothstep(1.05, 0.6, t);
    fragColor.x *= 0.35 + brightness * 0.4;
    fragColor.y *= 0.45 + brightness * 0.35;
    fragColor.z *= 0.45 + brightness * 0.35;

    if (saturation != 1.0) {
      float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
      fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
    }

    fragColor.rgb *= raysColor;
  }

  void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    gl_FragColor = color;
  }
`;

export function LightRays({
  raysOrigin = "top-center",
  raysColor = "#ffffff",
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1,
  saturation = 1,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0,
  distortion = 0,
  className,
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const uniformsRef = useRef<any>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseSmoothRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);
  const propsRef = useRef({
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
  });

  // Track props without re-creating the renderer when they change.
  propsRef.current = {
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
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(canvas);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const [r, g, b] = hexToRgb(raysColor);
    const initialAnchor = getAnchor(
      raysOrigin,
      container.clientWidth || 1,
      container.clientHeight || 1
    );

    const uniforms: Record<string, { value: any }> = {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector2(
          container.clientWidth || 1,
          container.clientHeight || 1
        ),
      },
      rayPos: { value: new THREE.Vector2(...initialAnchor.anchor) },
      rayDir: { value: new THREE.Vector2(...initialAnchor.dir) },
      raysColor: { value: new THREE.Vector3(r, g, b) },
      raysSpeed: { value: raysSpeed },
      lightSpread: { value: lightSpread },
      rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1 : 0 },
      fadeDistance: { value: fadeDistance },
      saturation: { value: saturation },
      mousePos: { value: new THREE.Vector2(0.5, 0.5) },
      mouseInfluence: { value: followMouse ? mouseInfluence : 0 },
      noiseAmount: { value: noiseAmount },
      distortion: { value: distortion },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      if (!container || !rendererRef.current) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      rendererRef.current.setPixelRatio(dpr);
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setSize(w, h);
      uniforms.iResolution.value.set(w * dpr, h * dpr);
      const { anchor, dir } = getAnchor(
        propsRef.current.raysOrigin,
        w * dpr,
        h * dpr
      );
      uniforms.rayPos.value.set(anchor[0], anchor[1]);
      uniforms.rayDir.value.set(dir[0], dir[1]);
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    resize();

    // Sync prop updates onto uniforms without rebuilding the shader.
    const syncUniforms = () => {
      const u = uniformsRef.current;
      if (!u) return;
      const p = propsRef.current;
      const [cr, cg, cb] = hexToRgb(p.raysColor);
      u.raysColor.value.set(cr, cg, cb);
      u.raysSpeed.value = p.raysSpeed;
      u.lightSpread.value = p.lightSpread;
      u.rayLength.value = p.rayLength;
      u.pulsating.value = p.pulsating ? 1 : 0;
      u.fadeDistance.value = p.fadeDistance;
      u.saturation.value = p.saturation;
      u.mouseInfluence.value = p.followMouse ? p.mouseInfluence : 0;
      u.noiseAmount.value = p.noiseAmount;
      u.distortion.value = p.distortion;
    };

    const start = performance.now();
    const tick = () => {
      const u = uniformsRef.current;
      if (!u || !rendererRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const tSec = (performance.now() - start) / 1000;
      u.iTime.value = tSec;

      if (propsRef.current.followMouse && propsRef.current.mouseInfluence > 0) {
        const target = mouseRef.current;
        const smooth = mouseSmoothRef.current;
        // Same low-pass weight (0.92/0.08) used upstream for buttery follow.
        smooth.x = 0.92 * smooth.x + 0.08 * target.x;
        smooth.y = 0.92 * smooth.y + 0.08 * target.y;
        u.mousePos.value.set(smooth.x, smooth.y);
      }

      try {
        rendererRef.current.render(scene, camera);
      } catch (err) {
        // Renderer torn down mid-frame; stop the loop.
        console.warn("WebGL rendering error:", err);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    };

    if (followMouse) {
      window.addEventListener("mousemove", onMouseMove);
    }

    // Keep uniforms in sync when props change between renders.
    const propWatcher = setInterval(syncUniforms, 100);

    return () => {
      clearInterval(propWatcher);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      try {
        const ext = renderer.getContext().getExtension("WEBGL_lose_context");
        ext?.loseContext();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      } catch {
        /* ignore teardown errors */
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      rendererRef.current = null;
      uniformsRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative h-full w-full overflow-hidden ${
        className ?? ""
      }`.trim()}
    />
  );
}