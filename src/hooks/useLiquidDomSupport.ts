import { useEffect, useState } from 'react';

export type LiquidDomSupport = 'checking' | 'supported' | 'unsupported';

type GpuNavigator = Navigator & {
  gpu?: { requestAdapter(): Promise<GpuAdapter | null> };
};

type GpuAdapter = unknown;

type Canvas2dWithHtmlInCanvas = CanvasRenderingContext2D & {
  drawElement?: unknown;
  drawElementImage?: unknown;
};

type GpuQueueWithHtmlInCanvas = {
  copyElementImageToTexture?: unknown;
};

/** True when the html-in-canvas / canvas-draw-element APIs are present. */
export function hasHtmlInCanvasSupport(): boolean {
  const ctxProto = CanvasRenderingContext2D.prototype as Canvas2dWithHtmlInCanvas;
  if (typeof ctxProto.drawElementImage === 'function') return true;
  if (typeof ctxProto.drawElement === 'function') return true;

  const queueCtor = (globalThis as { GPUQueue?: { prototype: GpuQueueWithHtmlInCanvas } }).GPUQueue;
  if (queueCtor && typeof queueCtor.prototype.copyElementImageToTexture === 'function') {
    return true;
  }

  return false;
}

/** Detect WebGPU + html-in-canvas (required for liquid-dom Html). */
export function useLiquidDomSupport(): LiquidDomSupport {
  const [state, setState] = useState<LiquidDomSupport>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const nav = navigator as GpuNavigator;
      if (!nav.gpu) {
        if (!cancelled) setState('unsupported');
        return;
      }

      try {
        const adapter = await nav.gpu.requestAdapter();
        if (!adapter) {
          if (!cancelled) setState('unsupported');
          return;
        }

        if (!cancelled) {
          setState(hasHtmlInCanvasSupport() ? 'supported' : 'unsupported');
        }
      } catch {
        if (!cancelled) setState('unsupported');
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
