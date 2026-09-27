import { Renderer, Camera, Transform, Program, Mesh, Torus, Vec2 } from 'ogl';

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // gentle "breathing" displacement along the normal
    vec3 p = position + normal * sin(uTime * 0.8 + position.y * 3.0) * 0.03;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, vView), 0.0), 2.2);
    vec3 violet = vec3(0.655, 0.545, 0.980);
    vec3 cyan   = vec3(0.133, 0.827, 0.933);
    vec3 pink   = vec3(0.957, 0.447, 0.714);
    float t = n.y * 0.5 + 0.5 + sin(uTime * 0.4 + n.x * 3.0) * 0.15;
    vec3 col = mix(mix(violet, cyan, clamp(t, 0.0, 1.0)), pink, fresnel);
    // soft key light from top-left
    float key = max(dot(n, normalize(vec3(-0.4, 0.8, 0.6))), 0.0);
    col = col * (0.45 + 0.55 * key) + fresnel * 0.55;
    float alpha = 0.6 + fresnel * 0.4;
    gl_FragColor = vec4(col, alpha);
  }
`;

export interface Hero3DOptions {
  reduceMotion: MediaQueryList;
}

/** Mounts an iridescent torus rendered with OGL (~tiny WebGL lib). Returns a cleanup fn. */
export function mountHero3D(host: HTMLElement, { reduceMotion }: Hero3DOptions): () => void {
  const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  host.prepend(gl.canvas);

  const camera = new Camera(gl, { fov: 35 });
  camera.position.z = 7;

  const scene = new Transform();
  const geometry = new Torus(gl, { radius: 1, tube: 0.42, radialSegments: 48, tubularSegments: 160 });
  const program = new Program(gl, { vertex, fragment, uniforms: { uTime: { value: 0 } }, transparent: true, cullFace: false });
  const mesh = new Mesh(gl, { geometry, program });
  mesh.setParent(scene);
  mesh.rotation.x = 0.9;

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.perspective({ aspect: width / height });
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const pointer = new Vec2(0, 0);
  const smooth = new Vec2(0, 0);
  const onPointer = (e: PointerEvent) => {
    pointer.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  io.observe(host);

  let frame = 0;
  let last = performance.now();
  let time = 0;

  const render = () => renderer.render({ scene, camera });

  const loop = (now: number) => {
    frame = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    program.uniforms.uTime.value = time;
    smooth.lerp(pointer, 0.05);
    mesh.rotation.y += dt * 0.25;
    mesh.rotation.x = 0.9 + smooth.y * 0.6;
    mesh.rotation.z = smooth.x * 0.4;
    render();
    if (visible && !document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(loop);
  };

  function start() {
    if (reduceMotion.matches) {
      render(); // one static frame, no animation
      return;
    }
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  }

  const onVisibility = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVisibility);
  reduceMotion.addEventListener('change', start);
  start();

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    reduceMotion.removeEventListener('change', start);
    gl.canvas.remove();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
