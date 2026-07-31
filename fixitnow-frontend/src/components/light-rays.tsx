"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface LightRaysProps {
  raysOrigin?: "top-center" | "top-left" | "top-right" | "middle" | "bottom-center";
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

export function LightRays({
  raysOrigin = "top-center",
  raysColor = "#00ffff",
  raysSpeed = 1,
  lightSpread = 0.8,
  rayLength = 1.2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.1,
  distortion = 0.05,
  className,
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;

    const rayCount = 18;
    const geo = new THREE.PlaneGeometry(2, 2);

    const colorVec = new THREE.Color(raysColor);
    const baseColor = new THREE.Vector3(colorVec.r, colorVec.g, colorVec.b);

    const getOrigin = () => {
      const map: any = {
        "top-center": [0.5, 1.0],
        "top-left": [0.0, 1.0],
        "top-right": [1.0, 1.0],
        middle: [0.5, 0.5],
        "bottom-center": [0.5, 0.0],
      };
      return map[raysOrigin] || [0.5, 1.0];
    };

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(w, h) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uOrigin: { value: new THREE.Vector2(getOrigin()[0], getOrigin()[1]) },
      uColor: { value: baseColor },
      uSpread: { value: lightSpread },
      uLength: { value: rayLength },
      uSpeed: { value: raysSpeed },
      uPulsate: { value: pulsating ? 1 : 0 },
      uFade: { value: fadeDistance },
      uSaturation: { value: saturation },
      uMouseInfluence: { value: followMouse ? mouseInfluence : 0 },
      uNoise: { value: noiseAmount },
      uDistort: { value: distortion },
    };
    uniformsRef.current = uniforms;

    const vert = /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `;
    const frag = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec2 uOrigin;
      uniform vec3 uColor;
      uniform float uSpread;
      uniform float uLength;
      uniform float uSpeed;
      uniform float uPulsate;
      uniform float uFade;
      uniform float uSaturation;
      uniform float uMouseInfluence;
      uniform float uNoise;
      uniform float uDistort;
      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1.0,0.0));
        float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }

      void main() {
        vec2 uv = vUv;
        vec2 origin = uOrigin;
        origin += (uMouse - 0.5) * uMouseInfluence;
        vec2 dir = uv - origin;
        float dist = length(dir);
        float angle = atan(dir.y, dir.x);
        float ray = 0.0;

        for (int i = 0; i < 18; i++) {
          float a = float(i) * (3.14159 / 9.0) - 1.5708;
          float diff = abs(mod(angle - a + 3.14159, 3.14159) - 1.5708);
          float band = exp(-diff * (12.0 + 10.0 * uSpread));
          float fall = exp(-dist * (1.5 - 0.5 * uLength));
          float pulse = 0.8 + 0.2 * sin(uTime * uSpeed * 1.5 + float(i) * 0.4);
          ray += band * fall * pulse;
        }
        ray *= 0.55;
        ray += noise(uv * 80.0 + uTime * 0.2) * uNoise * 0.2;
        float fade = 1.0 - smoothstep(0.0, uFade, dist);
        vec3 col = uColor * ray * fade;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(lum), col, uSaturation);
        gl_FragColor = vec4(col, ray * 0.85 * fade);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const onMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      uniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height
      );
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      const ww = container.clientWidth, hh = container.clientHeight;
      renderer.setSize(ww, hh);
      uniforms.uResolution.value.set(ww, hh);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      uniforms.uTime.value = ((performance.now() - start) / 1000) * raysSpeed;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, followMouse, mouseInfluence, noiseAmount, distortion, raysOrigin]);

  return <div ref={containerRef} className={`lightrays-wrap ${className ?? ""}`} />;
}