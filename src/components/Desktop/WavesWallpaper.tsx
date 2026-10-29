import { useEffect, useRef } from 'react';

/**
 * A live wallpaper: a lit sea of slow waves drawn by a fragment shader, in the spirit of the
 * animated backgrounds on desktop-in-a-browser sites. Sits over the static poster frame of the
 * same wallpaper, so a machine without WebGL still shows a picture. Honours the Reduce motion
 * setting and the OS preference by holding a single frame, and stops drawing while the tab is
 * hidden.
 */
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

// A rolling height field: a few long swells, a little chop on top.
float height(vec2 p, float t) {
  float v = 0.0;
  v += sin(p.x * 0.90 + p.y * 0.35 + t * 0.42) * 0.42;
  v += sin(p.x * 0.45 + p.y * 1.05 - t * 0.31) * 0.30;
  v += sin(p.x * 1.70 - p.y * 0.55 + t * 0.66) * 0.14;
  v += sin(p.y * 1.60 + p.x * 0.25 - t * 0.38) * 0.17;
  v += sin(p.x * 3.10 + p.y * 2.40 + t * 0.95) * 0.05;
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  // A tilted sheet: rows further up the screen are further away and a little compressed.
  float depth = 1.0 + uv.y * 0.9;
  vec2 p = vec2((uv.x - 0.5) * aspect * depth, uv.y * depth * 1.15) * 3.2;
  p.y += u_time * 0.05;
  float t = u_time;

  // Flat-shaded triangular facets, like a low-poly mesh: find the triangle under this
  // pixel and light it by the plane through its three corners.
  // The grid is sheared so the facets are not square tiles.
  float g = 0.52;
  vec2 q = vec2(p.x + p.y * 0.5, p.y) / g;
  vec2 cell = floor(q);
  vec2 f = fract(q);
  bool lower = f.x + f.y < 1.0;
  vec2 a = lower ? vec2(0.0, 0.0) : vec2(1.0, 1.0);
  vec2 b = vec2(1.0, 0.0);
  vec2 c = vec2(0.0, 1.0);
  // Back from grid space to plane space for each corner.
  vec2 wa = vec2((cell.x + a.x) - (cell.y + a.y) * 0.5, cell.y + a.y) * g;
  vec2 wb = vec2((cell.x + b.x) - (cell.y + b.y) * 0.5, cell.y + b.y) * g;
  vec2 wc = vec2((cell.x + c.x) - (cell.y + c.y) * 0.5, cell.y + c.y) * g;
  vec3 pa = vec3(wa, height(wa, t));
  vec3 pb = vec3(wb, height(wb, t));
  vec3 pc = vec3(wc, height(wc, t));
  vec3 n = normalize(cross(pb - pa, pc - pa));
  if (n.z < 0.0) n = -n;
  // n is (x, y, up) in plane space; swap to (x, up, y) for lighting.
  n = vec3(n.x, n.z, n.y);

  vec3 light = normalize(vec3(-0.5, 0.75, 0.45));
  float diff = clamp(dot(n, light), 0.0, 1.0);
  vec3 view = normalize(vec3(0.0, 0.8, 0.6));
  float spec = pow(clamp(dot(reflect(-light, n), view), 0.0, 1.0), 24.0);

  vec3 deep = vec3(0.015, 0.05, 0.14);
  vec3 mid = vec3(0.09, 0.30, 0.62);
  vec3 col = mix(deep, mid, pow(diff, 1.6));
  col += vec3(0.55, 0.72, 0.95) * spec * 0.4;
  // Distance haze towards the horizon.
  float fog = smoothstep(0.45, 1.0, uv.y);
  col = mix(col, vec3(0.03, 0.08, 0.20), fog * 0.75);
  gl_FragColor = vec4(col, 1.0);
}`;

function reduceMotion(): boolean {
  return (
    document.documentElement.dataset.reduceMotion === 'on' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function WavesWallpaper({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    let raf = 0;
    let stopped = false;
    const start = performance.now();

    function resize() {
      // Waves have no fine detail, so the picture is drawn at a modest resolution and scaled.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * 0.75;
      const w = Math.round(canvas!.clientWidth * dpr);
      const h = Math.round(canvas!.clientHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }
    }

    function frame() {
      if (stopped) return;
      resize();
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, reduceMotion() ? 0 : (performance.now() - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      // With motion reduced one frame is enough until something changes; look again later.
      raf = reduceMotion()
        ? window.setTimeout(() => (raf = requestAnimationFrame(frame)), 1000)
        : requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      clearTimeout(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clearTimeout(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={ref} className={className} style={{ width: '100%', height: '100%' }} aria-hidden />
  );
}
